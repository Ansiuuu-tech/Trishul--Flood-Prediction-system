"""
Seed data for Trishul: Uttarakhand State — 13 Districts and vulnerable
villages/settlements prone to cloudbursts, flash floods, GLOFs, and landslides.

Covers all 13 districts of Uttarakhand:
Garhwal Division:
  - Chamoli (Raini, Tapovan, Joshimath)
  - Rudraprayag (Kedarnath, Gaurikund, Sonprayag)
  - Uttarkashi (Dharali, Bhatwari, Harsil)
  - Tehri Garhwal (Ghansali, Kirtinagar, New Tehri)
  - Pauri Garhwal (Srinagar Garhwal, Kotdwar, Pauri)
  - Dehradun (Maldevta, Rishikesh, Sahastradhara)
  - Haridwar (Har Ki Pauri, Laksar, Roorkee)
Kumaon Division:
  - Pithoragarh (Malpa, Dharchula, Madkot)
  - Bageshwar (Sumgarh, Kapkot, Bageshwar)
  - Almora (Someshwar, Bhikiyasain, Almora)
  - Champawat (Tanakpur, Lohaghat, Champawat)
  - Nainital (Haldwani, Ramnagar, Nainital)
  - Udham Singh Nagar (Kichha, Rudrapur, Kashipur)
"""
from __future__ import annotations

import datetime as dt
import random

from sqlalchemy.orm import Session

from app.models import Alert, AlertRecipient, EvacuationShelter, HistoricalEvent, RiskAssessment, SensorReading, User, Zone


def _polygon(center_lat: float, center_lon: float, size: float = 0.02) -> dict:
    """Generate a small square-ish GeoJSON polygon around a center point."""
    return {
        "type": "Polygon",
        "coordinates": [[
            [center_lon - size, center_lat - size],
            [center_lon + size, center_lat - size],
            [center_lon + size, center_lat + size],
            [center_lon - size, center_lat + size],
            [center_lon - size, center_lat - size],
        ]],
    }


ZONES = [
    # ------------------ CHAMOLI DISTRICT ------------------
    dict(
        id="chamoli_raini",
        name="Raini",
        district="Chamoli",
        description="Raini Village, Chamoli District, Uttarakhand — Rishiganga valley, site of the catastrophic 2021 rock-ice avalanche flash flood.",
        latitude=30.4880,
        longitude=79.7040,
        population=1200,
        elevation_m=2150,
        slope_degrees=34,
        terrain_risk=94,
        safe_location="Raini Chak Lata High Ridge",
        evacuation_route="Move rapidly uphill away from Rishiganga riverbed toward upper Lata ridge safe assembly grounds.",
    ),
    dict(
        id="chamoli_tapovan",
        name="Tapovan",
        district="Chamoli",
        description="Tapovan, Chamoli District, Uttarakhand — Dhauliganga valley, site of the 2021 Tapovan Vishnugad hydel project inundation.",
        latitude=30.4950,
        longitude=79.6270,
        population=2800,
        elevation_m=1900,
        slope_degrees=31,
        terrain_risk=88,
        safe_location="Tapovan Upper Helipad Ground",
        evacuation_route="Ascend steep valley flank immediately toward Tapovan upper plateau away from Dhauliganga channel.",
    ),
    dict(
        id="chamoli_joshimath",
        name="Joshimath",
        district="Chamoli",
        description="Joshimath, Chamoli District, Uttarakhand — ancient landslide debris slope above Alaknanda, severe land subsidence zone.",
        latitude=30.5564,
        longitude=79.5668,
        population=17000,
        elevation_m=1875,
        slope_degrees=29,
        terrain_risk=86,
        safe_location="Auli Ropeway Station High Platform",
        evacuation_route="Move upward along designated civil defense paths toward Upper Bazaar and Auli transit grounds.",
    ),

    # ------------------ RUDRAPRAYAG DISTRICT ------------------
    dict(
        id="rudraprayag_kedarnath",
        name="Kedarnath",
        district="Rudraprayag",
        description="Kedarnath Temple Valley, Rudraprayag District, Uttarakhand — origin of 2013 Mandakini disaster below Chorabari moraine lake.",
        latitude=30.7352,
        longitude=79.0669,
        population=1500,
        elevation_m=3583,
        slope_degrees=36,
        terrain_risk=96,
        safe_location="Kedarnath Northern Three-Tier Wall High Ground",
        evacuation_route="Evacuate upward to reinforced safety platform behind the temple complex, avoiding Mandakini banks.",
    ),
    dict(
        id="rudraprayag_gaurikund",
        name="Gaurikund",
        district="Rudraprayag",
        description="Gaurikund, Rudraprayag District, Uttarakhand — narrow Mandakini gorge, vulnerable to massive debris flows and road washouts.",
        latitude=30.6528,
        longitude=79.0286,
        population=3200,
        elevation_m=1982,
        slope_degrees=38,
        terrain_risk=91,
        safe_location="Gaurikund Upper Bus Terminal Safe Shelter",
        evacuation_route="Move upward onto the upper concrete concourse away from river embankment.",
    ),
    dict(
        id="rudraprayag_sonprayag",
        name="Sonprayag",
        district="Rudraprayag",
        description="Sonprayag, Rudraprayag District, Uttarakhand — Mandakini and Vasuki Ganga confluence, high flash-flood bottleneck.",
        latitude=30.6300,
        longitude=78.9980,
        population=2500,
        elevation_m=1820,
        slope_degrees=32,
        terrain_risk=85,
        safe_location="Sonprayag Transit Camp High Ground",
        evacuation_route="Cross upstream suspension bypass and ascend to Sonprayag higher administrative shelf.",
    ),

    # ------------------ UTTARKASHI DISTRICT ------------------
    dict(
        id="uttarkashi_dharali",
        name="Dharali",
        district="Uttarkashi",
        description="Dharali, Uttarkashi District, Uttarakhand — Bhagirathi River corridor, prone to high-velocity stream debris surges.",
        latitude=31.0340,
        longitude=78.7840,
        population=1800,
        elevation_m=2680,
        slope_degrees=30,
        terrain_risk=84,
        safe_location="Dharali Apple Orchard Plateau",
        evacuation_route="Move away from Kheer Ganga stream bed upward to the orchard terrace safe zone.",
    ),
    dict(
        id="uttarkashi_bhatwari",
        name="Bhatwari",
        district="Uttarkashi",
        description="Bhatwari, Uttarkashi District, Uttarakhand — Bhagirathi canyon, chronic slope failure and cloudburst corridor.",
        latitude=30.8200,
        longitude=78.6200,
        population=3600,
        elevation_m=1550,
        slope_degrees=28,
        terrain_risk=81,
        safe_location="Bhatwari Tehsil Sports Ground",
        evacuation_route="Climb westward along the stepped evacuation trail away from Bhagirathi flood marks.",
    ),
    dict(
        id="uttarkashi_harsil",
        name="Harsil",
        district="Uttarkashi",
        description="Harsil Valley, Uttarkashi District, Uttarakhand — Jalandhari and Bhagirathi confluence, high glacier runoff and flash flood risk.",
        latitude=31.0370,
        longitude=78.7380,
        population=2200,
        elevation_m=2620,
        slope_degrees=26,
        terrain_risk=77,
        safe_location="Harsil Army Cantonment Safe Deck",
        evacuation_route="Evacuate to elevated cantonment staging area north of the valley.",
    ),

    # ------------------ TEHRI GARHWAL DISTRICT ------------------
    dict(
        id="tehri_ghansali",
        name="Ghansali",
        district="Tehri Garhwal",
        description="Ghansali, Tehri Garhwal District, Uttarakhand — Bhilangna River valley, frequent cloudburst and flash flood epicenter.",
        latitude=30.4350,
        longitude=78.6500,
        population=8500,
        elevation_m=970,
        slope_degrees=27,
        terrain_risk=83,
        safe_location="Ghansali Inter College Ground",
        evacuation_route="Move directly up to the Ghansali Inter College terrace overlooking the Bhilangna river.",
    ),
    dict(
        id="tehri_kirtinagar",
        name="Kirtinagar",
        district="Tehri Garhwal",
        description="Kirtinagar, Tehri Garhwal District, Uttarakhand — Alaknanda right bank, vulnerable to upstream reservoir discharge and monsoon surges.",
        latitude=30.2150,
        longitude=78.7400,
        population=6200,
        elevation_m=560,
        slope_degrees=19,
        terrain_risk=69,
        safe_location="Kirtinagar Higher Secondary School Safe Zone",
        evacuation_route="Move away from lower Alaknanda ghats upward toward Kirtinagar market ridge.",
    ),
    dict(
        id="tehri_new_tehri",
        name="New Tehri",
        district="Tehri Garhwal",
        description="New Tehri, Tehri Garhwal District, Uttarakhand — planned hill town overlooking Tehri Dam, vulnerable to rim slope landslides.",
        latitude=30.3800,
        longitude=78.4800,
        population=25000,
        elevation_m=1750,
        slope_degrees=24,
        terrain_risk=68,
        safe_location="Baurari District Sports Complex",
        evacuation_route="Assemble at the Baurari central stadium grounds on the main ridge.",
    ),

    # ------------------ PAURI GARHWAL DISTRICT ------------------
    dict(
        id="pauri_srinagar",
        name="Srinagar Garhwal",
        district="Pauri Garhwal",
        description="Srinagar Garhwal, Pauri Garhwal District, Uttarakhand — broad Alaknanda valley floor, severely inundated in 2013 floods.",
        latitude=30.2226,
        longitude=78.7844,
        population=38000,
        elevation_m=560,
        slope_degrees=15,
        terrain_risk=75,
        safe_location="HNBGU Upper Chauras Campus",
        evacuation_route="Cross bridge before danger mark or move uphill to the upper university plateau away from Alaknanda.",
    ),
    dict(
        id="pauri_kotdwar",
        name="Kotdwar",
        district="Pauri Garhwal",
        description="Kotdwar, Pauri Garhwal District, Uttarakhand — foothills of Garhwal, flash-flooded by Khoh and Malan rivers during cloudbursts.",
        latitude=29.7460,
        longitude=78.5280,
        population=45000,
        elevation_m=450,
        slope_degrees=17,
        terrain_risk=72,
        safe_location="Kotdwar Railway Colony High Ground",
        evacuation_route="Move away from Khoh riverbank to the elevated northern railway and municipal sectors.",
    ),
    dict(
        id="pauri_pauri",
        name="Pauri",
        district="Pauri Garhwal",
        description="Pauri Town, Pauri Garhwal District, Uttarakhand — district headquarters ridge, road slip corridors during torrential rains.",
        latitude=30.1500,
        longitude=78.7800,
        population=28000,
        elevation_m=1814,
        slope_degrees=22,
        terrain_risk=65,
        safe_location="Pauri Agency Ground Safe Assembly",
        evacuation_route="Take municipal ridge road to Agency Ground assembly point.",
    ),

    # ------------------ DEHRADUN DISTRICT ------------------
    dict(
        id="dehradun_maldevta",
        name="Maldevta",
        district="Dehradun",
        description="Maldevta, Dehradun District, Uttarakhand — Song River basin, devastated by the August 2022 cloudburst and flash flood.",
        latitude=30.3150,
        longitude=78.1250,
        population=4200,
        elevation_m=720,
        slope_degrees=25,
        terrain_risk=86,
        safe_location="Maldevta Upper Kempty Ridge High Ground",
        evacuation_route="Immediately ascend the hill track north toward Kempty ridge, away from Song riverbed.",
    ),
    dict(
        id="dehradun_rishikesh",
        name="Rishikesh",
        district="Dehradun",
        description="Rishikesh, Dehradun District, Uttarakhand — Ganga river entry point, Chandrabhaga flood confluence and ghat inundations.",
        latitude=30.1030,
        longitude=78.2940,
        population=75000,
        elevation_m=372,
        slope_degrees=12,
        terrain_risk=67,
        safe_location="AIIMS Rishikesh High Terrace",
        evacuation_route="Move west from Ganga ghats to elevated bypass and AIIMS campus platform.",
    ),
    dict(
        id="dehradun_sahastradhara",
        name="Sahastradhara",
        district="Dehradun",
        description="Sahastradhara, Dehradun District, Uttarakhand — Baldi River gorge, recurrent flash flooding and limestone debris slides.",
        latitude=30.3870,
        longitude=78.1270,
        population=3100,
        elevation_m=840,
        slope_degrees=28,
        terrain_risk=80,
        safe_location="Sahastradhara Ropeway Upper Safe Deck",
        evacuation_route="Climb the concrete stairway path to the upper ropeway terrace away from riverbed.",
    ),

    # ------------------ HARIDWAR DISTRICT ------------------
    dict(
        id="haridwar_harkipauri",
        name="Har Ki Pauri",
        district="Haridwar",
        description="Har Ki Pauri, Haridwar District, Uttarakhand — Ganga river core channel, subject to sudden high barrage discharges.",
        latitude=29.9560,
        longitude=78.1700,
        population=52000,
        elevation_m=314,
        slope_degrees=8,
        terrain_risk=58,
        safe_location="Moti Chur High Ground Complex",
        evacuation_route="Clear the ghats westward toward upper railway road and elevated municipal shelters.",
    ),
    dict(
        id="haridwar_laksar",
        name="Laksar",
        district="Haridwar",
        description="Laksar, Haridwar District, Uttarakhand — Solani River and seasonal nullahs, severe lowland monsoon inundation and waterlogging.",
        latitude=29.7540,
        longitude=78.0280,
        population=22000,
        elevation_m=260,
        slope_degrees=4,
        terrain_risk=52,
        safe_location="Laksar Sugar Mill High Platform",
        evacuation_route="Evacuate to elevated concrete industrial platform and elevated railway station safe zones.",
    ),
    dict(
        id="haridwar_roorkee",
        name="Roorkee",
        district="Haridwar",
        description="Roorkee, Haridwar District, Uttarakhand — Solani river valley and upper Ganga canal plains, flash runoff accumulation point.",
        latitude=29.8543,
        longitude=77.8880,
        population=120000,
        elevation_m=268,
        slope_degrees=5,
        terrain_risk=44,
        safe_location="IIT Roorkee Elevated Main Campus",
        evacuation_route="Move toward the high ground of IIT Roorkee civil defense grounds.",
    ),

    # ------------------ PITHORAGARH DISTRICT ------------------
    dict(
        id="pithoragarh_malpa",
        name="Malpa",
        district="Pithoragarh",
        description="Malpa, Pithoragarh District, Uttarakhand — Kali River canyon, site of the 1998 catastrophic rockfall landslide disaster.",
        latitude=29.9000,
        longitude=80.7500,
        population=600,
        elevation_m=2200,
        slope_degrees=42,
        terrain_risk=97,
        safe_location="Malpa Upper ITBP Ridge Post",
        evacuation_route="Move immediately to reinforced military ridge bunker platform, away from canyon wall debris paths.",
    ),
    dict(
        id="pithoragarh_dharchula",
        name="Dharchula",
        district="Pithoragarh",
        description="Dharchula, Pithoragarh District, Uttarakhand — Kali River border town, severe embankment erosion and cloudburst flash floods.",
        latitude=29.8480,
        longitude=80.5370,
        population=9500,
        elevation_m=915,
        slope_degrees=32,
        terrain_risk=89,
        safe_location="Dharchula Stadium High Ground",
        evacuation_route="Ascend the zigzag path away from Kali river promenade to the town stadium.",
    ),
    dict(
        id="pithoragarh_madkot",
        name="Madkot",
        district="Pithoragarh",
        description="Madkot, Pithoragarh District, Uttarakhand — Gori Ganga valley, severe cloudburst, debris flow, and bridge washouts.",
        latitude=29.9800,
        longitude=80.3500,
        population=1400,
        elevation_m=1350,
        slope_degrees=35,
        terrain_risk=87,
        safe_location="Madkot Primary Health Center Terrace",
        evacuation_route="Evacuate upward along the tea plantation trail toward the medical center safe plateau.",
    ),

    # ------------------ BAGESHWAR DISTRICT ------------------
    dict(
        id="bageshwar_sumgarh",
        name="Sumgarh",
        district="Bageshwar",
        description="Sumgarh, Bageshwar District, Uttarakhand — steep catchment, site of the August 2010 cloudburst and landslide disaster.",
        latitude=29.9500,
        longitude=79.8800,
        population=900,
        elevation_m=1650,
        slope_degrees=33,
        terrain_risk=90,
        safe_location="Sumgarh Mandir High Ridge",
        evacuation_route="Climb eastward away from the valley ravine toward the hilltop temple grounds.",
    ),
    dict(
        id="bageshwar_kapkot",
        name="Kapkot",
        district="Bageshwar",
        description="Kapkot, Bageshwar District, Uttarakhand — upper Saryu river basin, gateway to Pindari glacier, cloudburst prone.",
        latitude=29.9400,
        longitude=79.9000,
        population=4500,
        elevation_m=1080,
        slope_degrees=29,
        terrain_risk=82,
        safe_location="Kapkot Inter College Grounds",
        evacuation_route="Move upward away from the Saryu riverbanks to the college terrace.",
    ),
    dict(
        id="bageshwar_town",
        name="Bageshwar",
        district="Bageshwar",
        description="Bageshwar Town, Bageshwar District, Uttarakhand — Saryu and Gomati river confluence, riverbank flash inundation zone.",
        latitude=29.8404,
        longitude=79.7694,
        population=15000,
        elevation_m=1004,
        slope_degrees=21,
        terrain_risk=73,
        safe_location="Bageshwar Degree College Safe Deck",
        evacuation_route="Move from lower ghats up to Degree College elevated platform.",
    ),

    # ------------------ ALMORA DISTRICT ------------------
    dict(
        id="almora_someshwar",
        name="Someshwar",
        district="Almora",
        description="Someshwar Valley, Almora District, Uttarakhand — Kosi River headwaters, agricultural plain prone to monsoon flash surges.",
        latitude=29.7750,
        longitude=79.6000,
        population=5800,
        elevation_m=1450,
        slope_degrees=20,
        terrain_risk=71,
        safe_location="Someshwar Tehsil High Terrace",
        evacuation_route="Ascend to upper tehsil buildings away from the Kosi river floodplain.",
    ),
    dict(
        id="almora_bhikiyasain",
        name="Bhikiyasain",
        district="Almora",
        description="Bhikiyasain, Almora District, Uttarakhand — Ramganga and Gagas river confluence, rapid river level escalation corridor.",
        latitude=29.7020,
        longitude=79.2600,
        population=3400,
        elevation_m=850,
        slope_degrees=23,
        terrain_risk=76,
        safe_location="Bhikiyasain Community Hall Safe Deck",
        evacuation_route="Climb north hillside trail to community hall above confluence flood marks.",
    ),
    dict(
        id="almora_town",
        name="Almora",
        district="Almora",
        description="Almora Ridge, Almora District, Uttarakhand — central Kumaon ridge, hillside road slip hazards during intense cloudbursts.",
        latitude=29.5971,
        longitude=79.6591,
        population=35000,
        elevation_m=1638,
        slope_degrees=22,
        terrain_risk=64,
        safe_location="Almora Stadium Ridge Grounds",
        evacuation_route="Assemble at central sports stadium on the ridge spine.",
    ),

    # ------------------ CHAMPAWAT DISTRICT ------------------
    dict(
        id="champawat_tanakpur",
        name="Tanakpur",
        district="Champawat",
        description="Tanakpur, Champawat District, Uttarakhand — Sharda (Mahakali) river exit from Himalayas into plains, severe flood gateway.",
        latitude=29.0720,
        longitude=80.1100,
        population=18000,
        elevation_m=255,
        slope_degrees=11,
        terrain_risk=74,
        safe_location="Tanakpur Barrage High Ground Complex",
        evacuation_route="Move away from Sharda riverbanks to the elevated canal administration compound.",
    ),
    dict(
        id="champawat_lohaghat",
        name="Lohaghat",
        district="Champawat",
        description="Lohaghat, Champawat District, Uttarakhand — Lohawati River valley, narrow mountain stream subject to sudden cloudburst swelling.",
        latitude=29.4100,
        longitude=80.0900,
        population=8200,
        elevation_m=1750,
        slope_degrees=25,
        terrain_risk=72,
        safe_location="Lohaghat Inter College Ground",
        evacuation_route="Move up to college grounds away from the Lohawati stream corridor.",
    ),
    dict(
        id="champawat_town",
        name="Champawat",
        district="Champawat",
        description="Champawat Town, Champawat District, Uttarakhand — ancient capital on steep mid-Himalayan spur, heavy monsoon slide vulnerability.",
        latitude=29.3364,
        longitude=80.1018,
        population=11000,
        elevation_m=1610,
        slope_degrees=26,
        terrain_risk=70,
        safe_location="Champawat District Court Grounds",
        evacuation_route="Climb to the district court complex safe zone on the main ridge.",
    ),

    # ------------------ NAINITAL DISTRICT ------------------
    dict(
        id="nainital_haldwani",
        name="Haldwani",
        district="Nainital",
        description="Haldwani, Nainital District, Uttarakhand — Gaula River fan, catastrophic October 2021 flash flood breached railway bridge and colonies.",
        latitude=29.2183,
        longitude=79.5130,
        population=160000,
        elevation_m=424,
        slope_degrees=14,
        terrain_risk=81,
        safe_location="MB Inter College Haldwani Safe Shelter",
        evacuation_route="Move west away from Gaula riverbanks into elevated central city sectors.",
    ),
    dict(
        id="nainital_ramnagar",
        name="Ramnagar",
        district="Nainital",
        description="Ramnagar, Nainital District, Uttarakhand — Kosi River exit near Corbett, severe monsoon discharge surges and resort area inundation.",
        latitude=29.3950,
        longitude=79.1270,
        population=54000,
        elevation_m=345,
        slope_degrees=12,
        terrain_risk=68,
        safe_location="Ramnagar MP Inter College Platform",
        evacuation_route="Evacuate away from Kosi riverbed to the central college high platform.",
    ),
    dict(
        id="nainital_town",
        name="Nainital",
        district="Nainital",
        description="Nainital Town, Nainital District, Uttarakhand — fragile limestone and shale slopes surrounding the lake, debris flow hazard.",
        latitude=29.3919,
        longitude=79.4542,
        population=42000,
        elevation_m=2084,
        slope_degrees=31,
        terrain_risk=79,
        safe_location="Nainital Flats Central Safe Zone",
        evacuation_route="Move toward the broad open Flats platform away from the steep hillside slopes.",
    ),

    # ------------------ UDHAM SINGH NAGAR DISTRICT ------------------
    dict(
        id="usnagar_kichha",
        name="Kichha",
        district="Udham Singh Nagar",
        description="Kichha, Udham Singh Nagar District, Uttarakhand — Kichha River basin, severe lowland monsoon inundation and agricultural waterlogging.",
        latitude=28.9180,
        longitude=79.5050,
        population=42000,
        elevation_m=200,
        slope_degrees=3,
        terrain_risk=55,
        safe_location="Kichha Mandi Samiti Elevated Complex",
        evacuation_route="Evacuate from lower river colonies to elevated agricultural market platforms.",
    ),
    dict(
        id="usnagar_rudrapur",
        name="Rudrapur",
        district="Udham Singh Nagar",
        description="Rudrapur, Udham Singh Nagar District, Uttarakhand — Tarai plain receiving heavy runoff from Kumaon foothills, industrial basin flooding.",
        latitude=28.9774,
        longitude=79.4000,
        population=150000,
        elevation_m=205,
        slope_degrees=3,
        terrain_risk=50,
        safe_location="Rudrapur Sports Stadium High Platform",
        evacuation_route="Move to elevated stadium grandstand and multi-purpose safe shelters.",
    ),
    dict(
        id="usnagar_kashipur",
        name="Kashipur",
        district="Udham Singh Nagar",
        description="Kashipur, Udham Singh Nagar District, Uttarakhand — Dhela river basin, flash inundation from Shivalik foothills.",
        latitude=29.2100,
        longitude=78.9600,
        population=125000,
        elevation_m=218,
        slope_degrees=4,
        terrain_risk=48,
        safe_location="Kashipur Radhey Hari College Safe Zone",
        evacuation_route="Move away from Dhela riverbanks to the elevated college campus.",
    ),
]

HISTORICAL_EVENTS = {
    "chamoli_raini": [
        ("flash_flood", "severe", 204, dt.date(2021, 2, 7), "Rock and ice avalanche near Nanda Devi triggered a massive flash flood down Rishiganga, destroying Raini bridges and the hydel plant."),
    ],
    "rudraprayag_kedarnath": [
        ("flash_flood", "severe", 5700, dt.date(2013, 6, 16), "Chorabari Lake outburst flooded Kedarnath shrine and swept downstream settlements along the Mandakini river."),
    ],
    "pithoragarh_malpa": [
        ("landslide", "severe", 221, dt.date(1998, 8, 18), "The catastrophic Malpa rockfall buried the entire village and Kailash Mansarovar pilgrims in the Kali river gorge."),
    ],
    "dehradun_maldevta": [
        ("flash_flood", "severe", 7, dt.date(2022, 8, 20), "A midnight cloudburst in Maldevta triggered a violent surge down Song River, destroying bridges and inundating resorts."),
    ],
    "nainital_haldwani": [
        ("flash_flood", "severe", 28, dt.date(2021, 10, 18), "Unprecedented 500mm+ 24-hour storm overwhelmed Gaula river, collapsing the railway approach bridge and flooding colonies."),
    ],
    "bageshwar_sumgarh": [
        ("flash_flood", "severe", 18, dt.date(2010, 8, 18), "A devastating cloudburst triggered a landslide and flash flood that collapsed the village primary school building."),
    ],
    "uttarkashi_dharali": [
        ("flash_flood", "severe", 35, dt.date(2012, 8, 4), "Assi Ganga cloudburst triggered catastrophic flash floods and debris flows washing away bridges and roads."),
    ],
}

_SHELTERS = {
    "chamoli_raini": [
        ("Raini Chak Lata Safe Ground", 30.4900, 79.7060, 300, "community_center"),
        ("Lata Village Community Hall", 30.4940, 79.7120, 200, "school"),
    ],
    "chamoli_tapovan": [
        ("Tapovan Helipad Safe Ground", 30.4970, 79.6290, 500, "community_center"),
        ("Tapovan Primary School", 30.4930, 79.6250, 250, "school"),
    ],
    "chamoli_joshimath": [
        ("Auli Ropeway Station High Platform", 30.5580, 79.5680, 800, "community_center"),
        ("Joshimath Cantonment Relief Camp", 30.5540, 79.5640, 600, "school"),
    ],
    "rudraprayag_kedarnath": [
        ("Kedarnath Safety Wall High Deck", 30.7360, 79.0675, 500, "temple"),
        ("Kedarnath GMVN Safe Shelter", 30.7340, 79.0655, 350, "community_center"),
    ],
    "rudraprayag_gaurikund": [
        ("Gaurikund Terminal Safe Hall", 30.6535, 79.0295, 400, "community_center"),
    ],
    "rudraprayag_sonprayag": [
        ("Sonprayag Transit Safe Camp", 30.6310, 78.9990, 500, "community_center"),
    ],
    "uttarkashi_dharali": [
        ("Dharali Orchard Safe Shelter", 31.0350, 78.7855, 300, "community_center"),
    ],
    "uttarkashi_bhatwari": [
        ("Bhatwari Tehsil Sports Shelter", 30.8215, 78.6215, 450, "school"),
    ],
    "uttarkashi_harsil": [
        ("Harsil Army Cantonment Safe Deck", 31.0385, 78.7395, 500, "community_center"),
    ],
    "dehradun_maldevta": [
        ("Maldevta Kempty Ridge Relief Center", 30.3170, 78.1270, 400, "school"),
    ],
    "dehradun_rishikesh": [
        ("AIIMS Rishikesh High Terrace", 30.1050, 78.2960, 1000, "school"),
    ],
    "dehradun_sahastradhara": [
        ("Sahastradhara Ropeway Upper Deck", 30.3885, 78.1285, 350, "community_center"),
    ],
    "pithoragarh_malpa": [
        ("Malpa ITBP Safe Bunker", 29.9015, 80.7515, 200, "community_center"),
    ],
    "pithoragarh_dharchula": [
        ("Dharchula Stadium Safe Ground", 29.8495, 80.5385, 600, "school"),
    ],
    "pithoragarh_madkot": [
        ("Madkot Health Center Terrace", 29.9815, 80.3515, 250, "community_center"),
    ],
    "nainital_haldwani": [
        ("MB Inter College Haldwani Safe Shelter", 29.2200, 79.5150, 1200, "school"),
    ],
    "nainital_ramnagar": [
        ("Ramnagar MP Inter College Platform", 29.3965, 79.1285, 800, "school"),
    ],
    "nainital_town": [
        ("Nainital Flats Safe Zone", 29.3930, 79.4555, 900, "community_center"),
    ],
    "bageshwar_sumgarh": [
        ("Sumgarh Mandir High Ridge", 29.9515, 79.8815, 250, "temple"),
    ],
    "bageshwar_kapkot": [
        ("Kapkot Inter College Grounds", 29.9415, 79.9015, 400, "school"),
    ],
    "bageshwar_town": [
        ("Bageshwar Degree College Safe Deck", 29.8420, 79.7710, 600, "school"),
    ],
}


def seed_baseline_readings_and_risk(db: Session) -> None:
    """(Re)create one baseline 'Safe' sensor reading + risk assessment per zone."""
    from app.risk_engine import RiskInputs, evaluate_risk

    zones = db.query(Zone).all()
    if not zones:
        return
    if db.query(SensorReading).count() > 0:
        return

    for zone in zones:
        rng = random.Random(hash(zone.id) % (2**32))
        reading = SensorReading(
            zone_id=zone.id,
            source="simulator",
            rainfall_mm_1h=rng.uniform(0, 3),
            rainfall_mm_3h=rng.uniform(0, 8),
            rainfall_mm_24h=rng.uniform(2, 20),
            soil_moisture_pct=rng.uniform(25, 45),
            tilt_degrees=rng.uniform(0.5, 2.0),
            tilt_change_rate=rng.uniform(0, 0.3),
            vibration_g=rng.uniform(0.02, 0.15),
            battery_pct=rng.uniform(80, 100),
            is_online=True,
            recorded_at=dt.datetime.now(dt.timezone.utc),
        )
        db.add(reading)
        db.flush()

        history_risk = 40.0 if zone.id in HISTORICAL_EVENTS else 10.0
        inputs = RiskInputs(
            zone_id=zone.id,
            rainfall_mm_1h=reading.rainfall_mm_1h,
            rainfall_mm_3h=reading.rainfall_mm_3h,
            rainfall_mm_24h=reading.rainfall_mm_24h,
            soil_moisture_pct=reading.soil_moisture_pct,
            tilt_degrees=reading.tilt_degrees,
            tilt_change_rate=reading.tilt_change_rate,
            vibration_g=reading.vibration_g,
            terrain_risk_static=zone.terrain_risk,
            history_risk_static=history_risk,
            is_online=True,
            reading_age_seconds=0,
        )
        result = evaluate_risk(inputs)
        db.add(RiskAssessment(
            zone_id=zone.id,
            score=result.score,
            level=result.level,
            confidence=result.confidence,
            rainfall_risk=result.rainfall_risk,
            soil_risk=result.soil_risk,
            tilt_risk=result.tilt_risk,
            vibration_risk=result.vibration_risk,
            terrain_risk=result.terrain_risk,
            history_risk=result.history_risk,
            reasons=result.reasons,
            recommended_action=result.recommended_action,
            estimated_lead_time_minutes=result.estimated_lead_time_minutes,
            data_quality_warning=result.data_quality_warning,
            model_version=result.model_version,
        ))
    db.commit()


_DEMO_USERS = [
    ("viewer_demo", "viewer@trishul.demo", "Demo Viewer", "viewer"),
    ("operator_demo", "operator@trishul.demo", "Demo Operator", "operator"),
    ("admin_demo", "admin@trishul.demo", "Demo Administrator", "administrator"),
]


def _ensure_demo_users(db: Session) -> None:
    for username, email, full_name, role in _DEMO_USERS:
        user = db.query(User).filter(User.username == username).first()
        if user:
            if not user.email:
                user.email = email
            if not user.full_name:
                user.full_name = full_name
            if not user.display_name:
                user.display_name = full_name
        else:
            db.add(User(
                username=username,
                email=email,
                full_name=full_name,
                display_name=full_name,
                role=role,
                is_demo_account=True,
            ))
    db.commit()


def seed_shelters(db: Session) -> None:
    if db.query(EvacuationShelter).count() > 0:
        return
    for zone_id, shelters in _SHELTERS.items():
        for name, lat, lng, capacity, shelter_type in shelters:
            db.add(EvacuationShelter(
                zone_id=zone_id,
                name=name,
                lat=lat,
                lng=lng,
                capacity=capacity,
                shelter_type=shelter_type,
                is_primary=True,
            ))
    db.commit()


ALERT_RECIPIENTS = [
    # Chamoli
    {
        "id": "rec_chamoli_deoc",
        "name": "Chamoli DEOC Emergency Officer",
        "phone_number": "+919811100001",
        "role": "DEOC Officer",
        "district": "Chamoli",
        "zone_id": None,
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_chamoli_raini_pradhan",
        "name": "Bawan Singh (Gram Pradhan, Raini)",
        "phone_number": "+919811100002",
        "role": "Gram Pradhan",
        "district": "Chamoli",
        "zone_id": "chamoli_raini",
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_chamoli_tapovan_dam",
        "name": "Tapovan-Vishnugad Barrage Chief Engineer",
        "phone_number": "+919811100003",
        "role": "Dam In-charge",
        "district": "Chamoli",
        "zone_id": "chamoli_tapovan",
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_chamoli_sdrf_joshimath",
        "name": "Joshimath SDRF Post Commander",
        "phone_number": "+919811100004",
        "role": "SDRF Commander",
        "district": "Chamoli",
        "zone_id": "chamoli_joshimath",
        "min_alert_level": "Warning",
    },
    # Rudraprayag
    {
        "id": "rec_rudraprayag_deoc",
        "name": "Rudraprayag DEOC Disaster Cell",
        "phone_number": "+919811100005",
        "role": "DEOC Officer",
        "district": "Rudraprayag",
        "zone_id": None,
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_rudraprayag_kedarnath_shrine",
        "name": "Kedarnath Shrine Security & Safety Post",
        "phone_number": "+919811100006",
        "role": "Temple Safety Officer",
        "district": "Rudraprayag",
        "zone_id": "rudraprayag_kedarnath",
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_rudraprayag_gaurikund_pradhan",
        "name": "Gaurikund Transit Camp In-charge",
        "phone_number": "+919811100007",
        "role": "Gram Pradhan",
        "district": "Rudraprayag",
        "zone_id": "rudraprayag_gaurikund",
        "min_alert_level": "Watch",
    },
    # Uttarkashi
    {
        "id": "rec_uttarkashi_deoc",
        "name": "Uttarkashi DEOC Control Room",
        "phone_number": "+919811100008",
        "role": "DEOC Officer",
        "district": "Uttarkashi",
        "zone_id": None,
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_uttarkashi_dharali_pradhan",
        "name": "Dharali Gram Pradhan",
        "phone_number": "+919811100009",
        "role": "Gram Pradhan",
        "district": "Uttarkashi",
        "zone_id": "uttarkashi_dharali",
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_uttarkashi_bro_bhagirathi",
        "name": "BRO Officer (Bhagirathi River Highway)",
        "phone_number": "+919811100010",
        "role": "Highway Maintenance",
        "district": "Uttarkashi",
        "zone_id": "uttarkashi_harsil",
        "min_alert_level": "Warning",
    },
    # Dehradun
    {
        "id": "rec_dehradun_seoc",
        "name": "Uttarakhand State Emergency Ops Centre (SEOC)",
        "phone_number": "+919811100011",
        "role": "SEOC Director",
        "district": "Dehradun",
        "zone_id": None,
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_dehradun_maldevta_pradhan",
        "name": "Maldevta Village Pradhan",
        "phone_number": "+919811100012",
        "role": "Gram Pradhan",
        "district": "Dehradun",
        "zone_id": "dehradun_maldevta",
        "min_alert_level": "Watch",
    },
    # Pithoragarh
    {
        "id": "rec_pithoragarh_deoc",
        "name": "Pithoragarh DEOC Border Emergency Post",
        "phone_number": "+919811100013",
        "role": "DEOC Officer",
        "district": "Pithoragarh",
        "zone_id": None,
        "min_alert_level": "Watch",
    },
    {
        "id": "rec_pithoragarh_malpa_post",
        "name": "Malpa ITBP/SDRF Warning Post",
        "phone_number": "+919811100014",
        "role": "Emergency Services",
        "district": "Pithoragarh",
        "zone_id": "pithoragarh_malpa",
        "min_alert_level": "Watch",
    },
    # Nainital
    {
        "id": "rec_nainital_gaula_dam",
        "name": "Gaula Barrage Inundation Control Officer",
        "phone_number": "+919811100015",
        "role": "Dam In-charge",
        "district": "Nainital",
        "zone_id": "nainital_haldwani",
        "min_alert_level": "Watch",
    },
    # Haridwar
    {
        "id": "rec_haridwar_ganga_barrage",
        "name": "Bhimawala / Haridwar Barrage Controller",
        "phone_number": "+919811100016",
        "role": "Dam In-charge",
        "district": "Haridwar",
        "zone_id": "haridwar_har_ki_pauri",
        "min_alert_level": "Watch",
    },
]


def seed_alert_recipients(db: Session) -> None:
    """Seed key disaster response stakeholders and village heads for early SMS warnings."""
    if db.query(AlertRecipient).count() > 0:
        return
    existing_zone_ids = {z.id for z in db.query(Zone.id).all()}
    for r in ALERT_RECIPIENTS:
        zid = r.get("zone_id")
        if zid and zid not in existing_zone_ids:
            zid = None
        db.add(AlertRecipient(
            id=r["id"],
            name=r["name"],
            phone_number=r["phone_number"],
            role=r["role"],
            district=r["district"],
            zone_id=zid,
            min_alert_level=r.get("min_alert_level", "Watch"),
            is_active=True,
        ))
    db.commit()



def seed_database(db: Session) -> None:
    """Seed or synchronize zones for all 13 Uttarakhand districts and villages."""
    target_ids = {z["id"] for z in ZONES}
    existing_ids = {z.id for z in db.query(Zone.id).all()}

    # If database has obsolete zones (e.g. old demo zones like rasuwa, or count mismatch)
    if existing_ids != target_ids:
        # Clear child dependencies before re-seeding
        db.query(Alert).delete()
        db.query(RiskAssessment).delete()
        db.query(SensorReading).delete()
        db.query(HistoricalEvent).delete()
        db.query(EvacuationShelter).delete()
        # Nullify user home_zone_id references to deleted zones
        db.query(User).update({User.home_zone_id: None})
        db.query(Zone).delete()
        db.commit()

        for z in ZONES:
            zone = Zone(
                id=z["id"],
                name=z["name"],
                district=z["district"],
                description=z["description"],
                latitude=z["latitude"],
                longitude=z["longitude"],
                population=z["population"],
                elevation_m=z["elevation_m"],
                slope_degrees=z["slope_degrees"],
                terrain_risk=z["terrain_risk"],
                geojson_polygon=_polygon(z["latitude"], z["longitude"]),
                safe_location=z["safe_location"],
                evacuation_route=z["evacuation_route"],
                is_fictional=False,
            )
            db.add(zone)

            for event_type, severity, fatalities, event_date, description in HISTORICAL_EVENTS.get(z["id"], []):
                db.add(HistoricalEvent(
                    zone_id=z["id"],
                    event_type=event_type,
                    event_date=dt.datetime(event_date.year, event_date.month, event_date.day, tzinfo=dt.timezone.utc),
                    severity=severity,
                    fatalities=fatalities,
                    description=description,
                ))

        db.commit()
        seed_shelters(db)
        _ensure_demo_users(db)
        seed_baseline_readings_and_risk(db)
        seed_alert_recipients(db)
        return

    _ensure_demo_users(db)
    seed_shelters(db)
    seed_baseline_readings_and_risk(db)
    seed_alert_recipients(db)