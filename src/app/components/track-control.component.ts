import { Map as MapboxMap } from "mapbox-gl";

export enum TrackType {
    Enabled,
    Disabled
}

export class TrackControl {
    private map: MapboxMap;
    private path: any;
    private trackType: TrackType;
    private trackPositionWatch: number;

    constructor(map: MapboxMap) {
        this.map = map;
        this.path = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: []
            }
        };
        console.log("in track")
        this.trackPositionWatch = window.navigator.geolocation.watchPosition(
            position => {
                this.path.geometry.coordinates.push([
                    position.coords.longitude,
                    position.coords.latitude
                ]);
                if (this.map && this.map.getSource("track")) {
                    this.map.getSource("track").setData(this.path);
                }
            },
            err => console.error(err),
            {
                enableHighAccuracy: true
            }
        );

        this.map.addSource("track", { type: "geojson", data: this.path });
        this.map.addLayer({
            id: "track",
            type: "line",
            source: "track",
            paint: {
                "line-color": "cyan",
                "line-opacity": 0.5,
                "line-width": 5
            },
            layout: {
                "line-cap": "round"
            }
        });
        this.map.setLayoutProperty('track', 'visibility', 'none');
    }

    public setType(type: TrackType): void {
        if (this.map != undefined) {
            this.trackType = type
            this.reset();
            this.update();
        }
    }

    private reset(): void {

    }

    private update(): void {
        switch (this.trackType) {
            case TrackType.Enabled:
                this.map.setLayoutProperty('track', 'visibility', 'visible');
                break;
            case TrackType.Disabled:
                this.map.setLayoutProperty('track', 'visibility', 'none');
                break;

        }
    }

    public remove(): void {
        if (this.map.getLayer('track')) {
            this.map.removeLayer('track')
        }
        window.navigator.geolocation.clearWatch(this.trackPositionWatch);
    }
}