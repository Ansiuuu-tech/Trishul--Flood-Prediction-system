import { Card } from '@/components/ui';
import { Navigation, Footer } from '@/components/layout';
import { Link } from 'react-router-dom';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <div className="animate-pulse space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </Card>
  );
}
