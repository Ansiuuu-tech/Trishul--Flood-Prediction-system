"""
Evacuation Routing Module using OSMnx + NetworkX.

Provides risk-weighted shortest path computation from a zone to its nearest
evacuation shelter. The road graph is fetched once and cached to disk.
"""
from __future__ import annotations

import json
import math
import os
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import networkx as nx
import osmnx as ox

from app.config import get_settings
from app.models import EvacuationShelter, RiskAssessment, Zone
from app.database import session_scope

settings = get_settings()

CACHE_DIR = Path(os.getenv("DATA_DIR", str(Path(__file__).resolve().parents[1] / "data"))) / "evacuation_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

GRAPH_CACHE_FILE = CACHE_DIR / "road_graph.pkl"
GRAPH_META_FILE = CACHE_DIR / "road_graph_meta.json"

RISK_PENALTIES = {"Evacuate": 50.0, "Warning": 10.0, "Watch": 2.0, "Safe": 1.0}


@dataclass
class RouteResult:
    path: list[tuple[float, float]]
    distance_m: float
    duration_min: float
    shelter_id: str
    shelter_name: str
    shelter_lat: float
    shelter_lng: float
    shelter_capacity: int
    shelter_type: str
    shelter_is_primary: bool
    zone_id: str
    zone_name: str
    zone_lat: float
    zone_lng: float
    zone_terrain_risk: float


def _get_graph_cache_key(place_name: str) -> str:
    return f"{place_name.lower().replace(' ', '_').replace(',', '')}"


def _load_cached_graph(place_name: str) -> nx.MultiDiGraph | None:
    key = _get_graph_cache_key(place_name)
    cache_file = CACHE_DIR / f"{key}.pkl"
    meta_file = CACHE_DIR / f"{key}_meta.json"

    if not cache_file.exists() or not meta_file.exists():
        return None

    try:
        with meta_file.open("r") as f:
            meta = json.load(f)
        if meta.get("place_name") != place_name:
            return None

        with cache_file.open("rb") as f:
            G = pickle.load(f)
        print(f"[evacuation_router] Loaded cached graph for '{place_name}' ({len(G.nodes)} nodes, {len(G.edges)} edges)")
        return G
    except Exception as e:
        print(f"[evacuation_router] Failed to load cached graph: {e}")
        return None


def _save_graph_cache(G: nx.MultiDiGraph, place_name: str) -> None:
    key = _get_graph_cache_key(place_name)
    cache_file = CACHE_DIR / f"{key}.pkl"
    meta_file = CACHE_DIR / f"{key}_meta.json"

    try:
        with cache_file.open("wb") as f:
            pickle.dump(G, f)
        with meta_file.open("w") as f:
            json.dump({"place_name": place_name, "nodes": len(G.nodes), "edges": len(G.edges)}, f)
        print(f"[evacuation_router] Cached graph for '{place_name}' to disk")
    except Exception as e:
        print(f"[evacuation_router] Failed to cache graph: {e}")


def get_road_graph(place_name: str = "Uttarakhand, India") -> nx.MultiDiGraph:
    """
    Fetch or load cached road network graph for the given place.

    Args:
        place_name: OSM place name (e.g., "Uttarakhand, India" or "Dehradun district, Uttarakhand, India")

    Returns:
        NetworkX MultiDiGraph with road network.
    """
    cached = _load_cached_graph(place_name)
    if cached is not None:
        return cached

    print(f"[evacuation_router] Fetching road graph for '{place_name}' from OSM (this may take 1-2 minutes)...")
    try:
        G = ox.graph_from_place(place_name, network_type="drive", simplify=True)
        G = ox.add_edge_speeds(G)
        G = ox.add_edge_travel_times(G)
        print(f"[evacuation_router] Fetched graph: {len(G.nodes)} nodes, {len(G.edges)} edges")
        _save_graph_cache(G, place_name)
        return G
    except Exception as e:
        print(f"[evacuation_router] Failed to fetch graph for '{place_name}': {e}")
        raise


def _nearest_node(G: nx.MultiDiGraph, lat: float, lng: float) -> int:
    """Find the nearest graph node to the given lat/lng."""
    return ox.distance.nearest_nodes(G, X=lng, Y=lat)


def _straight_line_route(zone_data: dict[str, Any], shelter: dict[str, Any]) -> RouteResult:
    """Return a local fallback when an OSM road graph cannot be obtained.

    The line is deliberately labelled by the UI as a fallback, but it keeps
    the destination pointer and evacuation guidance available offline.
    """
    lat1, lng1 = math.radians(zone_data["latitude"]), math.radians(zone_data["longitude"])
    lat2, lng2 = math.radians(shelter["lat"]), math.radians(shelter["lng"])
    a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    distance_m = 6_371_008.8 * 2 * math.asin(math.sqrt(a))
    return RouteResult(
        path=[(zone_data["latitude"], zone_data["longitude"]), (shelter["lat"], shelter["lng"])],
        distance_m=distance_m,
        duration_min=max(1, distance_m / 1_000 / 4 * 60),
        shelter_id=shelter["id"], shelter_name=shelter["name"], shelter_lat=shelter["lat"], shelter_lng=shelter["lng"],
        shelter_capacity=shelter["capacity"], shelter_type=shelter["shelter_type"], shelter_is_primary=shelter["is_primary"],
        zone_id=zone_data["id"], zone_name=zone_data["name"], zone_lat=zone_data["latitude"], zone_lng=zone_data["longitude"],
        zone_terrain_risk=zone_data["terrain_risk"],
    )


def _compute_risk_weight(G: nx.MultiDiGraph, high_risk_zones: list[dict[str, Any]]) -> nx.MultiDiGraph:
    """Copy the road graph and inflate costs for roads near active risk zones."""
    H = G.copy()

    for u, v, k, data in H.edges(keys=True, data=True):
        base_time = float(data.get("travel_time", 60.0))

        u_lat = H.nodes[u].get("y", 0)
        u_lng = H.nodes[u].get("x", 0)
        v_lat = H.nodes[v].get("y", 0)
        v_lng = H.nodes[v].get("x", 0)

        edge_mid_lat = (u_lat + v_lat) / 2
        edge_mid_lng = (u_lng + v_lng) / 2

        risk_weight = base_time
        for zone in high_risk_zones:
            distance_degrees = ((edge_mid_lat - zone["lat"]) ** 2 + (edge_mid_lng - zone["lng"]) ** 2) ** 0.5
            if distance_degrees < 0.02:  # approximately two kilometres
                risk_weight *= RISK_PENALTIES.get(zone["risk_level"], 1.0)
        data["risk_weight"] = risk_weight

    return H


def compute_evacuation_route(zone_id: str, place_name: str) -> RouteResult | None:
    """
    Compute the risk-weighted shortest evacuation route from a zone to its nearest shelter.

    Args:
        zone_id: Zone identifier
        place_name: OSM place name for road graph

    Returns:
        RouteResult with path coordinates, distance, duration, shelter, and zone info.
        Returns None if zone/shelter not found or no path exists.
    """
    with session_scope() as db:
        zone = db.get(Zone, zone_id)
        if not zone:
            print(f"[evacuation_router] Zone '{zone_id}' not found")
            return None

        shelters = db.query(EvacuationShelter).filter(EvacuationShelter.zone_id == zone_id).order_by(
            EvacuationShelter.is_primary.desc(), EvacuationShelter.capacity.desc()
        ).all()
        if not shelters:
            print(f"[evacuation_router] No shelter found for zone '{zone_id}'")
            return None

        zone_data = {
            "id": zone.id,
            "name": zone.name,
            "latitude": zone.latitude,
            "longitude": zone.longitude,
            "terrain_risk": zone.terrain_risk,
        }
        latest_assessments: dict[str, RiskAssessment] = {}
        for assessment in db.query(RiskAssessment).order_by(RiskAssessment.created_at.desc()).all():
            latest_assessments.setdefault(assessment.zone_id, assessment)
        high_risk_zones = [
            {"lat": candidate.latitude, "lng": candidate.longitude, "risk_level": assessment.level}
            for candidate in db.query(Zone).all()
            if (assessment := latest_assessments.get(candidate.id)) and assessment.level in {"Watch", "Warning", "Evacuate"}
        ]
        shelter_candidates = [
            {
                "id": shelter.id, "name": shelter.name, "lat": shelter.lat, "lng": shelter.lng,
                "capacity": shelter.capacity, "shelter_type": shelter.shelter_type,
                "is_primary": shelter.is_primary,
            }
            for shelter in shelters
        ]

    # A zone must never be routed to a centre in another district.
    # When the road-network service is unavailable, return a direct fallback
    # so responders can still see the correct local centre on the map.
    fallback_shelter = shelter_candidates[0]
    try:
        G = get_road_graph(place_name)
    except Exception:
        return _straight_line_route(zone_data, fallback_shelter)
    H = _compute_risk_weight(G, high_risk_zones)

    zone_node = _nearest_node(H, zone_data["latitude"], zone_data["longitude"])
    path: list[int] | None = None
    shelter_data: dict[str, Any] | None = None
    best_cost = float("inf")
    for shelter in shelter_candidates:
        shelter_node = _nearest_node(H, shelter["lat"], shelter["lng"])
        try:
            cost = nx.shortest_path_length(H, zone_node, shelter_node, weight="risk_weight")
        except nx.NetworkXNoPath:
            continue
        if cost < best_cost:
            best_cost = cost
            path = nx.shortest_path(H, zone_node, shelter_node, weight="risk_weight")
            shelter_data = shelter
    if path is None or shelter_data is None:
        print(f"[evacuation_router] No route found from zone '{zone_id}' to any shelter")
        return _straight_line_route(zone_data, fallback_shelter)

    path_coords = [(H.nodes[n]["y"], H.nodes[n]["x"]) for n in path]

    total_distance = 0.0
    total_time = 0.0
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge_data = H.get_edge_data(u, v)
        if edge_data:
            for k, data in edge_data.items():
                total_distance += data.get("length", 0)
                total_time += data.get("travel_time", 0)
                break

    return RouteResult(
        path=path_coords,
        distance_m=total_distance,
        duration_min=total_time / 60.0,
        shelter_id=shelter_data["id"],
        shelter_name=shelter_data["name"],
        shelter_lat=shelter_data["lat"],
        shelter_lng=shelter_data["lng"],
        shelter_capacity=shelter_data["capacity"],
        shelter_type=shelter_data["shelter_type"],
        shelter_is_primary=shelter_data["is_primary"],
        zone_id=zone_data["id"],
        zone_name=zone_data["name"],
        zone_lat=zone_data["latitude"],
        zone_lng=zone_data["longitude"],
        zone_terrain_risk=zone_data["terrain_risk"],
    )


def get_evacuation_route_geojson(route_result: RouteResult) -> dict:
    """Convert RouteResult to GeoJSON LineString for frontend mapping."""
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [[lng, lat] for lat, lng in route_result.path],
        },
        "properties": {
            "distance_km": round(route_result.distance_m / 1000, 2),
            "duration_min": round(route_result.duration_min, 1),
            "shelter_name": route_result.shelter_name,
            "shelter_type": route_result.shelter_type,
            "shelter_capacity": route_result.shelter_capacity,
            "zone_name": route_result.zone_name,
            "zone_id": route_result.zone_id,
        },
    }
