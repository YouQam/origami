import { Map as MapboxMap } from "mapbox-gl";
import { OrigamiGeolocationService } from '../services/origami-geolocation.service';
import { Plugins, GeolocationPosition } from '@capacitor/core';
import { Subscription } from 'rxjs';


export enum MaskType {
    Enabled,
    Disabled
}


export class MaskControl {
    private positionSubscription: Subscription;
    private maskType: MaskType = MaskType.Disabled

    private map: MapboxMap;

    private isInitalized = false;

    constructor(map: MapboxMap, private geolocationService: OrigamiGeolocationService) {
        this.map = map;

        this.positionSubscription = this.geolocationService.geolocationSubscription.subscribe(position => {
            if (this.map && this.map.getLayer('circle-mask')) {
                this.map.getSource('circle-mask').setData({
                    type: "Point",
                    coordinates: [position.coords.longitude, position.coords.latitude]
                });
            }
        });

        this.map.addSource("circle-mask", {
            type: "geojson",
            data: {
                type: "Point",
                coordinates: [
                    7.626, 51.960
                ]
            }
        });

        this.map.addLayer({
            id: "circle-mask",
            source: "circle-mask",
            type: "circle",
            layout: {
                'visibility': 'visible'
            },
            'paint': {
                'circle-radius': {
                    stops: [[8, 1], [10, 5], [12, 10], [14, 15], [16, 45], [18, 210]]
                },
                'circle-stroke-width': 800,
                'circle-stroke-color': "#808080",
                'circle-stroke-opacity': 0.5,
                'circle-opacity': 0
            }
        });

        this.map.setLayoutProperty('circle-mask', 'visibility', 'none');
        this.isInitalized = true;
        this.update()
    }

    public setType(type: MaskType): void {
        if (this.map != undefined) {
            this.maskType = type
            this.reset();
            this.update();
        }
    }

    toggle() {
        if (this.map.getLayoutProperty("circle-mask", "visibility") == 'none') {
            this.map.setLayoutProperty('circle-mask', 'visibility', 'visible');
        } else {
            this.map.setLayoutProperty('circle-mask', 'visibility', 'none');
        }

    }

    private reset(): void {
        if (this.map.getLayer('circle-mask') && this.map.getLayoutProperty("circle-mask", "visibility") == 'visible') {
            this.map.setLayoutProperty('circle-mask', 'visibility', 'none');
        }
    }

    private update(): void {
        if (!this.isInitalized) {
            return
        }
        switch (this.maskType) {
            case MaskType.Disabled:
                this.reset()
                break;
            case MaskType.Enabled:
                if (this.map.getLayoutProperty("circle-mask", "visibility") == 'none')
                    this.map.setLayoutProperty('circle-mask', 'visibility', 'visible');

                break;
        }
    }

    public remove(): void {
        this.reset();
        this.positionSubscription.unsubscribe();
    }
}