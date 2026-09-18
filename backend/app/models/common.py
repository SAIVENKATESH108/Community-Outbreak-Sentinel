"""Common geographic and shared Pydantic models."""

from pydantic import BaseModel, Field


class LocationPoint(BaseModel):
    """WGS84 Geographical Point (Latitude & Longitude)."""

    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")

    def to_wkt(self) -> str:
        """PostGIS Well-Known Text format: POINT(lon lat)."""
        return f"POINT({self.longitude} {self.latitude})"
