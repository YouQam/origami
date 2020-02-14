import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GamesService } from "../../../services/games.service";
import { OsmService } from "../../../services/osm.service";
import { TrackerService } from "../../../services/tracker.service";
import { Device } from "@ionic-native/device/ngx";

import mapboxgl from "mapbox-gl";
// import MapboxCompare from "mapbox-gl-compare";

import { Geolocation, Geoposition } from "@ionic-native/geolocation/ngx";
import {
  DeviceOrientation,
  DeviceOrientationCompassHeading
} from "@ionic-native/device-orientation/ngx";

import {
  ModalController,
  NavController,
  ToastController
} from "@ionic/angular";
import { environment } from "src/environments/environment";
import { Game } from "src/app/models/game";
// import { MapboxStyleSwitcherControl } from "mapbox-gl-style-switcher";
import { Subscription } from "rxjs";

import { Insomnia } from "@ionic-native/insomnia/ngx";
import { Vibration } from "@ionic-native/vibration/ngx";

import { Camera, CameraOptions } from "@ionic-native/camera/ngx";

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

import { RotationControl, RotationType } from './../../../components/rotation-control.component'
import { ViewDirectionControl, ViewDirectionType } from './../../../components/view-direction-control.component';
import { LandmarkControl } from 'src/app/components/landmark-control.component';
import { StreetSectionControl, StreetSectionType } from './../../../components/street-section-control.component'
import { LayerControl, LayerType } from 'src/app/components/layer-control.component';

import { AlertController } from '@ionic/angular';
import { Platform } from '@ionic/angular';



@Component({
  selector: "app-playing-game",
  templateUrl: "./playing-game.page.html",
  styleUrls: ["./playing-game.page.scss"]
})
export class PlayingGamePage implements OnInit {
  @ViewChild("map", { static: false }) mapContainer;
  @ViewChild("swipeMap", { static: false }) swipeMapContainer;

  game: Game;

  map: mapboxgl.Map;
  userSelectMarker: mapboxgl.Marker;
  zoomControl: mapboxgl.NavigationControl = new mapboxgl.NavigationControl();

  // map features
  panCenter: boolean = false;
  // styleSwitcherControl: MapboxStyleSwitcherControl = new MapboxStyleSwitcherControl();
  // autoRotate: boolean = false;
  directionArrow: boolean = false;
  swipe: boolean = false;

  // _orientTo = (e: DeviceOrientationEvent) => {
  //   if (e.beta <= 60 && e.beta >= 0) {
  //     this.map.setPitch(e.beta);
  //   }
  // };

  clickDirection = 0;

  rotationControl: RotationControl;
  viewDirectionControl: ViewDirectionControl;
  landmarkControl: LandmarkControl;
  streetSectionControl: StreetSectionControl;
  layerControl: LayerControl

  // tasks
  task: any;
  taskIndex: number = 0;

  // position
  geolocateControl: mapboxgl.GeolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserLocation: true
  });
  lastKnownPosition: Geoposition;

  track: boolean = false;
  path: any;

  // streetSection: boolean = false;

  // treshold to trigger location arrive
  triggerTreshold: Number = 15;

  // degree for nav-arrow
  heading: number = 0;
  compassHeading: number = 0;
  targetHeading: number = 0;
  targetDistance: number = 0;
  directionBearing: number = 0;
  indicatedDirection: number = 0;

  showSuccess: boolean = false;
  public lottieConfig: Object;

  Math: Math = Math;

  uploadDone: boolean = false;

  positionWatch: any;
  deviceOrientationSubscription: Subscription;

  baseOptions: CameraOptions = {
    quality: 50,
    destinationType: this.camera.DestinationType.DATA_URL,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    correctOrientation: true
  };

  cameraOptions: CameraOptions = {
    ...this.baseOptions,
    sourceType: this.camera.PictureSourceType.CAMERA
  };

  photo: string;

  // multiple choice
  selectedPhoto: string;
  isCorrectPhotoSelected: boolean;

  constructor(
    private route: ActivatedRoute,
    public modalController: ModalController,
    public toastController: ToastController,
    private gamesService: GamesService,
    public navCtrl: NavController,
    private deviceOrientation: DeviceOrientation,
    private changeDetectorRef: ChangeDetectorRef,
    private OSMService: OsmService,
    private trackerService: TrackerService,
    private device: Device,
    private insomnia: Insomnia,
    private vibration: Vibration,
    private camera: Camera,
    public alertController: AlertController,
    public platform: Platform
  ) {
    this.lottieConfig = {
      path: "assets/lottie/star-success.json",
      renderer: "canvas",
      autoplay: true,
      loop: true
    };
  }

  ngOnInit() { }

  ionViewWillEnter() {
    // this.game = null;
    // this.game = new Game(0, "Loading...", false, []);
    // this.route.params.subscribe(params => {
    //   this.gamesService
    //     .getGame(params.id)
    //     .then(games => {
    //       this.game = games[0];
    //     })
    //     .finally(() => {
    //       this.initGame();
    //     });
    // });

    mapboxgl.accessToken = environment.mapboxAccessToken;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: document.body.classList.contains("dark")
        ? "mapbox://styles/mapbox/dark-v9"
        : "mapbox://styles/mapbox/streets-v9",
      center: [8, 51.8],
      zoom: 2
    });

    // const watch = this.geolocation.watchPosition();

    // watch.subscribe(async pos => {
    this.positionWatch = window.navigator.geolocation.watchPosition(
      pos => {
        this.trackerService.addWaypoint({
          position: {
            coordinates: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              accuracy: pos.coords.accuracy,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed
            },
            timestamp: pos.timestamp
          },
          compassHeading: this.compassHeading,
          mapViewport: {
            bounds: this.map.getBounds(),
            center: this.map.getCenter(),
            zoom: this.map.getZoom(),
            // style: this.map.getStyle(),
            bearing: this.map.getBearing(),
            pitch: this.map.getPitch()
          }
        });
        this.lastKnownPosition = pos;
        if (this.task && !this.showSuccess) {
          if (this.task.type.includes("nav")) {
            const waypoint = this.task.settings.point.geometry.coordinates;
            if (
              this.userDidArrive(waypoint) &&
              !this.task.settings.confirmation
            ) {
              this.onWaypointReached();
            }

            if (this.task.type == "nav-arrow") {
              const destCoords = this.task.settings.point.geometry.coordinates;
              const bearing = this.bearing(
                pos.coords.latitude,
                pos.coords.longitude,
                destCoords[1],
                destCoords[0]
              );
              this.heading = bearing;
            }
          }
        }

        if (this.panCenter) {
          this.map.setCenter(pos.coords);
        }

        if (this.track) {
          this.path.geometry.coordinates.push([
            pos.coords.longitude,
            pos.coords.latitude
          ]);

          if (this.map.getSource("track") == undefined) {
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
          } else {
            this.map.getSource("track").setData(this.path);
          }
        }

        if (this.task.type == "theme-direction" &&
          ((this.task.settings["question-type"].name == "question-type-current-direction") || (this.task.settings["question-type"].name == "photo"))) {
          if (this.map.getSource('viewDirectionClick')) {
            this.map.getSource('viewDirectionClick').setData({
              type: "Point",
              coordinates: [
                pos.coords.longitude,
                pos.coords.latitude
              ]
            })
          }
        }

        // if (this.streetSection) {
        // this.streetSectionControl.setType(StreetSectionType.Enabled)
        // this.OSMService.getStreetCoordinates(
        //   pos.coords.latitude,
        //   pos.coords.longitude
        // ).then(data => {
        //   const geometries = osmtogeojson(data);
        //   console.log(geometries);

        //   if (this.map.getSource("section") == undefined) {
        //     this.map.addSource("section", {
        //       type: "geojson",
        //       data: geometries
        //     });
        //     this.map.addLayer({
        //       id: "section",
        //       type: "line",
        //       source: "section",
        //       paint: {
        //         "line-color": "red",
        //         "line-opacity": 0.5,
        //         "line-width": 10
        //       },
        //       layout: {
        //         "line-cap": "round"
        //       }
        //     });
        //   } else {
        //     this.map.getSource("section").setData(geometries);
        //   }
        // });
        // }
      },
      err => console.log(err),
      {
        enableHighAccuracy: true
      }
    );

    this.map.on("load", () => {
      this.rotationControl = new RotationControl(this.map)
      this.viewDirectionControl = new ViewDirectionControl(this.map, this.deviceOrientation)
      this.landmarkControl = new LandmarkControl(this.map)
      this.streetSectionControl = new StreetSectionControl(this.map, this.OSMService);
      this.layerControl = new LayerControl(this.map, this.deviceOrientation, this.alertController, this.platform);

      // this.map.addControl(this.geolocateControl);
      // this.geolocateControl.trigger();
      this.game = null;
      this.game = new Game(0, "Loading...", false, []);
      this.route.params.subscribe(params => {
        this.gamesService
          .getGame(params.id)
          .then(games => {
            this.game = games[0];
          })
          .finally(() => {
            this.initGame();
          });
      });

      // this.map.addLayer(
      //   {
      //     id: "wms-test-layer",
      //     type: "raster",
      //     source: {
      //       type: "raster",
      //       tiles: [
      //         "https://ows.terrestris.de/osm/service?format=image/png&layers=OSM-WMS&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&styles&bbox={bbox-epsg-3857}&width=256&height=256"
      //       ],
      //       tileSize: 256
      //     },
      //     paint: {}
      //   },
      //   "country-label-lg"
      // );
      // this.map.removeLayer("country-label-lg");
      // console.log(this.map);
    });

    this.map.on("click", e => {
      console.log(e);
      console.log("click");
      this.trackerService.addEvent({
        type: "ON_MAP_CLICKED",
        position: {
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng
        }
      });
      if (this.task.type == "theme-direction" &&
        ((this.task.settings["question-type"].name == "question-type-current-direction") ||
          (this.task.settings["question-type"].name == "photo"))) {
        // let direction = Math.atan2(e.lngLat.lat - this.lastKnownPosition.coords.latitude, e.lngLat.lng - this.lastKnownPosition.coords.longitude) * 180 / Math.PI
        this.clickDirection = this.bearing(this.lastKnownPosition.coords.latitude, this.lastKnownPosition.coords.longitude, e.lngLat.lat, e.lngLat.lng)
        this.map.setLayoutProperty(
          "viewDirectionClick",
          "icon-rotate",
          this.clickDirection
        );
      } else {
        if (
          this.task.type == "theme-loc" ||
          (this.task.settings["answer-type"] &&
            this.task.settings["answer-type"].name == "set-point") ||
          (this.task.type == "theme-object" &&
            this.task.settings["question-type"].name == "photo") ||
          this.task.type == "theme-direction"
        ) {
          const pointFeature = this._toGeoJSONPoint(e.lngLat.lng, e.lngLat.lat);
          if (this.userSelectMarker) {
            this.userSelectMarker.setLngLat(e.lngLat);
          } else {
            this.userSelectMarker = new mapboxgl.Marker({
              color: "green",
              draggable: true
            })
              .setLngLat(pointFeature.geometry.coordinates)
              .addTo(this.map);
            this.userSelectMarker.on("dragend", () => {
              // TODO: implement
            });
          }
        }
      }
    });

    // rotation
    this.deviceOrientationSubscription = this.deviceOrientation
      .watchHeading()
      .subscribe((data: DeviceOrientationCompassHeading) => {
        this.compassHeading = data.magneticHeading;
        this.targetHeading = 360 - (this.compassHeading - this.heading);
        this.indicatedDirection = this.compassHeading - this.directionBearing;

        // if (this.autoRotate) {
        // this.map.rotateTo(data.magneticHeading, { duration: 10 });
        // this.map.setBearing(data.magneticHeading);
        // }
        // if (this.directionArrow) {
        // if (
        //   this.map.getSource("viewDirection") == undefined &&
        //   !this.map.hasImage("view-direction")
        // ) {
        //   this.map.loadImage(
        //     "/assets/icons/direction.png",
        //     (error, image) => {
        //       if (error) throw error;
        //       this.map.addImage("view-direction", image);

        //       this.map.addSource("viewDirection", {
        //         type: "geojson",
        //         data: {
        //           type: "Point",
        //           coordinates: [
        //             this.lastKnownPosition.coords.longitude,
        //             this.lastKnownPosition.coords.latitude
        //           ]
        //         }
        //       });

        //       this.map.addLayer({
        //         id: "viewDirection",
        //         source: "viewDirection",
        //         type: "symbol",
        //         layout: {
        //           "icon-image": "view-direction",
        //           "icon-size": 1,
        //           "icon-offset": [0, -25]
        //         }
        //       });
        //       this.map.setLayoutProperty(
        //         "viewDirection",
        //         "icon-rotate",
        //         data.magneticHeading
        //       );
        //     }
        //   );
        // } else {
        //   this.map.getSource("viewDirection").setData({
        //     type: "Point",
        //     coordinates: [
        //       this.lastKnownPosition.coords.longitude,
        //       this.lastKnownPosition.coords.latitude
        //     ]
        //   });
        //   this.map.setLayoutProperty(
        //     "viewDirection",
        //     "icon-rotate",
        //     data.magneticHeading
        //   );
        // }
        // }
      });

    this.path = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: []
      }
    };

    this.insomnia.keepAwake().then(
      () => console.log("success"),
      () => console.log("error")
    );
  }

  initGame() {
    const tasks = this.game.tasks;

    var bounds = new mapboxgl.LngLatBounds();

    tasks.forEach(task => {
      if (task.settings.point)
        bounds.extend(task.settings.point.geometry.coordinates);
    });

    try {
      this.map.fitBounds(bounds, { padding: 40, duration: 2000 });
    } catch (e) {
      console.log("Warning: Can not set bounds", bounds);
    }
    this.task = tasks[this.taskIndex];
    console.log("initializing trackerService");
    this.trackerService.init(this.game._id, this.device);
    this.trackerService.addEvent({
      type: "INIT_GAME"
    });
    this.initTask();
  }

  initTask() {
    this.vibration.vibrate([100, 100, 100]);
    console.log("Current task: ", this.task);
    this._initMapFeatures();
    this.trackerService.addEvent({
      type: "INIT_TASK",
      task: this.task
    });

    if (
      this.task.type.includes("theme") &&
      this.task.settings["question-type"] != undefined
    ) {
      this.task.settings.text = this.task.settings[
        "question-type"
      ].settings.text;
    }
    if (!this.task.type.includes("theme")) {
      if (this.task.settings.point != null && this.task.settings.showMarker) {
        const marker = new mapboxgl.Marker()
          .setLngLat(
            this.game.tasks[this.taskIndex].settings.point.geometry.coordinates
          )
          .addTo(this.map);
      }
    }

    if (this.task.type == "theme-direction" &&
      ((this.task.settings["question-type"].name == "question-type-current-direction") ||
        (this.task.settings["question-type"].name == "photo"))) {
      this.map.loadImage(
        "/assets/icons/directionv2.png",
        (error, image) => {
          if (error) throw error;

          this.map.addImage("view-direction-click", image);

          navigator.geolocation.getCurrentPosition(position => {
            console.log(position)
            this.map.addSource("viewDirectionClick", {
              type: "geojson",
              data: {
                type: "Point",
                coordinates: [
                  position.coords.longitude,
                  position.coords.latitude
                ]
              }
            });
            this.map.addLayer({
              id: "viewDirectionClick",
              source: "viewDirectionClick",
              type: "symbol",
              layout: {
                "icon-image": "view-direction",
                "icon-size": 0.65,
                "icon-offset": [0, -12.5]
              }
            });
          })
        });

    } else if (this.task.type == "theme-direction" && this.task.settings["question-type"].name == "question-type-photo") {

    } else if (this.task.type == "theme-direction") {
      console.log(this.task.settings["question-type"].settings.direction);
      this.directionBearing = this.task.settings[
        "question-type"
      ].settings.direction;
    }

    if (
      this.task.type == "theme-object" &&
      this.task.settings["question-type"].name == "question-type-map"
    ) {
      console.log(this.task.settings["question-type"].settings);
      this.landmarkControl.setQTLandmark(this.task.settings["question-type"].settings.polygon[0])
      // this.map.addLayer({
      //   id: "landmarks-qt-map",
      //   type: "fill-extrusion",
      //   source: {
      //     type: "geojson",
      //     data: this.task.settings["question-type"].settings.polygon[0]
      //   },
      //   paint: {
      //     "fill-extrusion-color": "#3880ff",
      //     "fill-extrusion-opacity": 0.5,
      //     "fill-extrusion-height": 20
      //   }
      // });
    }
  }

  onWaypointReached() {
    this.trackerService.addEvent({
      type: "WAYPOINT_REACHED"
    });
    this.nextTask();
  }

  nextTask() {
    this.taskIndex++;
    if (this.taskIndex > this.game.tasks.length - 1) {
      this.showSuccess = true;
      this.trackerService.addEvent({
        type: "FINISHED_GAME"
      });
      this.trackerService.uploadTrack().then(res => {
        if (res.status == 200) {
          console.log(res);
          this.uploadDone = true;
        }
      });
      this.vibration.vibrate([300, 300, 300]);
      this.insomnia.allowSleepAgain().then(
        () => console.log("success"),
        () => console.log("error")
      );
      return;
    }

    this.task = this.game.tasks[this.taskIndex];
    this.initTask();
    console.log(this.taskIndex, this.task);
  }

  async onMultipleChoiceSelected(item, event) {
    this.selectedPhoto = item;
    this.isCorrectPhotoSelected = item.key === "photo-0";
    Array.from(document.getElementsByClassName('multiple-choize-img')).forEach(elem => {
      elem.classList.remove('selected')
    })
    event.target.classList.add('selected')
    this.trackerService.addAnswer({
      task: this.task,
      answer: {
        "multiple-choice": item.key,
        correct: this.isCorrectPhotoSelected,
      }
    });
  }

  async onOkClicked() {
    this.trackerService.addEvent({
      type: "ON_OK_CLICKED",
      position: {
        coordinates: {
          latitude: this.lastKnownPosition.coords.latitude,
          longitude: this.lastKnownPosition.coords.longitude,
          altitude: this.lastKnownPosition.coords.altitude,
          accuracy: this.lastKnownPosition.coords.accuracy,
          altitudeAccuracy: this.lastKnownPosition.coords.altitudeAccuracy,
          heading: this.lastKnownPosition.coords.heading,
          speed: this.lastKnownPosition.coords.speed
        },
        timestamp: this.lastKnownPosition.timestamp
      },
      compassHeading: this.compassHeading,
      mapViewport: {
        bounds: this.map.getBounds(),
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        // style: this.map.getStyle(),
        bearing: this.map.getBearing(),
        pitch: this.map.getPitch()
      }
    });
    if (this.task.type == "theme-loc") {
      this.nextTask();
    } else if (
      this.task.type == "theme-object" &&
      this.task.settings["question-type"].name == "photo"
    ) {
      // const targetPosition = this.task.settings["question-type"].settings.point
      //   .geometry.coordinates;
      const clickPosition = [
        this.userSelectMarker._lngLat.lng,
        this.userSelectMarker._lngLat.lat
      ];

      const isInPolygon = booleanPointInPolygon(clickPosition, this.task.settings["question-type"].settings.polygon[0])

      // const distance = this.getDistanceFromLatLonInM(
      //   targetPosition[1],
      //   targetPosition[0],
      //   clickPosition.lat,
      //   clickPosition.lng
      // );

      this.trackerService.addAnswer({
        task: this.task,
        answer: {
          inPolygon: isInPolygon
        }
      });

      if (isInPolygon || this.task.settings.feedback == false) {
        this.nextTask();
      } else {
        const toast = await this.toastController.create({
          message: "Deine Eingabe ist falsch. Versuche es erneut",
          color: "dark",
          showCloseButton: true,
          duration: 2000
        });
        toast.present();
      }
    } else if (
      this.task.type == "theme-object" &&
      this.task.settings["question-type"].name == "description"
    ) {
      if (
        this.task.settings["answer-type"] &&
        this.task.settings["answer-type"].name == "take-photo"
      ) {
        if (this.photo == "") {
          const toast = await this.toastController.create({
            message: "Bitte mache ein Foto",
            color: "dark",
            showCloseButton: true,
            duration: 2000
          });
          toast.present();
        } else {
          this.trackerService.addAnswer({
            task: this.task,
            answer: {
              photo: this.photo
            }
          });
          this.nextTask();
          this.photo = "";
        }
      } else {
        if (
          this.task.settings["question-type"].settings["answer-type"].settings
            .polygon
        ) {
          const clickPosition = [
            this.userSelectMarker._lngLat.lng,
            this.userSelectMarker._lngLat.lat
          ];
          const polygon = this.task.settings["question-type"].settings[
            "answer-type"
          ].settings.polygon[0];

          const correct = booleanPointInPolygon(clickPosition, polygon);

          if (!correct && this.task.settings.feedback) {
            const toast = await this.toastController.create({
              message: "Deine Eingabe ist falsch. Versuche es erneut",
              color: "dark",
              showCloseButton: true,
              duration: 2000
            });
            toast.present();
          } else {
            this.nextTask();
          }
        } else {
          const targetPosition = this.task.settings["question-type"].settings[
            "answer-type"
          ].settings.point.geometry.coordinates;
          const clickPosition = this.userSelectMarker._lngLat;

          const distance = this.getDistanceFromLatLonInM(
            targetPosition[1],
            targetPosition[0],
            clickPosition.lat,
            clickPosition.lng
          );

          this.trackerService.addAnswer({
            task: this.task,
            answer: {
              distance: distance
            }
          });

          if (distance < this.triggerTreshold || this.task.settings.feedback == false) {
            this.nextTask();
          } else {
            const toast = await this.toastController.create({
              message: "Deine Eingabe ist falsch. Versuche es erneut",
              color: "dark",
              showCloseButton: true,
              duration: 2000
            });
            toast.present();
          }
        }
      }
    } else if (
      this.task.type == "info" ||
      (this.task.settings["answer-type"] != null &&
        this.task.settings["answer-type"].name == "take-photo")
    ) {
      this.nextTask();
    } else if (this.task.type == "theme-direction" &&
      this.task.settings["question-type"].name != "question-type-current-direction" &&
      this.task.settings["question-type"].name != "photo" &&
      this.task.settings["answer-type"].name != "multiple-choice") {
      this.trackerService.addAnswer({
        task: this.task,
        answer: {
          direction: this.compassHeading
        }
      });
      console.log(this.directionBearing, this.compassHeading);
      if (this.Math.abs(this.directionBearing - this.compassHeading) > 45) {
        const toast = await this.toastController.create({
          message: "Bitte drehe dich zur angezeigten Blickrichtung",
          color: "dark",
          showCloseButton: true,
          duration: 2000
        });
        toast.present();
      } else {
        this.nextTask();
      }
    } else if (this.task.type == "theme-direction" && this.task.settings["question-type"].name == "question-type-current-direction") {
      console.log(this.clickDirection, this.compassHeading)
      if (this.task.settings.feedback) {
        if (Math.abs(this.clickDirection - this.compassHeading) < 45) {
          this.nextTask()
          this.map.removeLayer('viewDirectionClick')
        } else {
          const toast = await this.toastController.create({
            message: "Deine Eingabe ist falsch. Versuche es erneut",
            color: "dark",
            showCloseButton: true,
            duration: 2000
          });
          toast.present();
        }
      } else {
        this.nextTask();
        this.map.removeLayer('viewDirectionClick')
      }
    } else if (this.task.type == "theme-direction" && this.task.settings["question-type"].name == "photo") {
      const myTargetHeading = this.task.settings["question-type"].settings.direction
      console.log(this.clickDirection, myTargetHeading)
      if (this.task.settings.feedback) {
        if (Math.abs(this.clickDirection - myTargetHeading) < 45) {
          this.nextTask()
          this.map.removeLayer('viewDirectionClick')
        } else {
          const toast = await this.toastController.create({
            message: "Deine Eingabe ist falsch. Versuche es erneut",
            color: "dark",
            showCloseButton: true,
            duration: 2000
          });
          toast.present();
        }
      } else {
        this.nextTask();
        this.map.removeLayer('viewDirectionClick')
      }
    } else if (
      this.task.settings["answer-type"] &&
      this.task.settings["answer-type"].name == "multiple-choice"
    ) {
      if (this.selectedPhoto != null) {
        console.log("feedback:", this.task.settings.feedback);
        if (this.task.settings.feedback) {
          console.log(
            "feeisCorrectPhotoSelecteddback:",
            this.isCorrectPhotoSelected
          );
          if (this.isCorrectPhotoSelected) {
            this.nextTask();
            this.isCorrectPhotoSelected = null;
            this.selectedPhoto = null;
          } else {
            const toast = await this.toastController.create({
              message: "Deine Eingabe ist falsch. Versuche es erneut",
              color: "dark",
              showCloseButton: true,
              duration: 2000
            });
            toast.present();
            // this.isCorrectPhotoSelected = null;
            // this.selectedPhoto = null;
          }
        } else {
          this.nextTask();
          this.isCorrectPhotoSelected = null;
          this.selectedPhoto = null;
        }
      } else {
        const toast = await this.toastController.create({
          message: "Bitte wähle zuerst ein Foto",
          color: "dark",
          showCloseButton: true,
          duration: 2000
        });
        toast.present();
      }
    } else {
      // TODO: disable button
      const waypoint = this.task.settings.point.geometry.coordinates;
      if (
        this.userDidArrive(waypoint) ||
        this.task.settings.feedback == false
      ) {
        this.onWaypointReached();
      } else {
        const toast = await this.toastController.create({
          message: "Deine Eingabe ist falsch. Versuche es erneut",
          color: "dark",
          showCloseButton: true,
          duration: 2000
        });
        toast.present();
      }
    }
  }

  userDidArrive(waypoint) {
    this.targetDistance = this.getDistanceFromLatLonInM(
      waypoint[1],
      waypoint[0],
      this.lastKnownPosition.coords.latitude,
      this.lastKnownPosition.coords.longitude
    );
    return this.targetDistance < this.triggerTreshold;
    // return this.geolocation.getCurrentPosition().then(pos => {
    // })
  }

  navigateHome() {
    navigator.geolocation.clearWatch(this.positionWatch);
    this.deviceOrientationSubscription.unsubscribe();
    this.navCtrl.navigateRoot("/");
    this.streetSectionControl.remove();
  }

  getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2 - lat1); // deg2rad below
    var dLon = this.deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c * 1000; // Distance in km
    return d; // distance in m
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Converts from radians to degrees.
  toDegrees(radians) {
    return (radians * 180) / Math.PI;
  }

  bearing(startLat, startLng, destLat, destLng) {
    startLat = this.deg2rad(startLat);
    startLng = this.deg2rad(startLng);
    destLat = this.deg2rad(destLat);
    destLng = this.deg2rad(destLng);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x =
      Math.cos(startLat) * Math.sin(destLat) -
      Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    const brng = Math.atan2(y, x);
    const brngDeg = this.toDegrees(brng);
    return (brngDeg + 360) % 360;
  }

  capturePhoto() {
    this.camera.getPicture(this.cameraOptions).then(
      imageData => {
        // imageData is either a base64 encoded string or a file URI
        // If it's base64 (DATA_URL):
        let base64Image = "data:image/jpeg;base64," + imageData;
        this.photo = base64Image;
      },
      err => {
        // Handle error
      }
    );
  }

  _initMapFeatures() {
    let mapFeatures = this.task.settings.mapFeatures;
    console.log("MapFeatures: ", mapFeatures);
    if (mapFeatures != undefined) {
      for (let key in mapFeatures) {
        if (mapFeatures.hasOwnProperty(key)) {
          switch (key) {
            case "zoombar":
              if (mapFeatures[key]) {
                this.map.scrollZoom.enable();
                this.map.doubleClickZoom.enable();
                this.map.touchZoomRotate.enable();
                this.map.addControl(this.zoomControl);
              } else {
                this.map.scrollZoom.disable();
                this.map.doubleClickZoom.disable();
                this.map.touchZoomRotate.disable();
              }
              break;
            case "pan":
              this.panCenter = false; // Reset value
              if (mapFeatures[key] == "true") {
                this.map.dragPan.enable();
              } else if (mapFeatures[key] == "center") {
                this.panCenter = true;
              } else if (mapFeatures[key] == "static") {
                this.map.dragPan.disable();
                this.map.scrollZoom.disable();
                this.map.doubleClickZoom.disable();
                this.map.touchZoomRotate.disable();
              }
              break;
            case "rotation":
              // this.autoRotate = false;

              if (mapFeatures[key] == "manual") {
                // // disable map rotation using right click + drag
                // this.map.dragRotate.enable();
                // // disable map rotation using touch rotation gesture
                // this.map.touchZoomRotate.enableRotation();
                // this.map.doubleClickZoom.enable();
                this.rotationControl.setType(RotationType.Manual)
              } else if (mapFeatures[key] == "auto") {
                // this.autoRotate = true;
                this.rotationControl.setType(RotationType.Auto)
              } else if (mapFeatures[key] == "button") {
                // TODO: implememt
                this.rotationControl.setType(RotationType.Button)
              } else if (mapFeatures[key] == "north") {
                // this.map.setBearing(0);
                // this.map.dragRotate.disable();
                // this.map.touchZoomRotate.disableRotation();
                this.rotationControl.setType(RotationType.North)
              }
              break;
            case "material":
              this.swipe = false;
              if (this.map.getLayer("satellite")) {
                this.map.removeLayer("satellite");
              }

              const elem = document.getElementsByClassName("mapboxgl-compare");
              while (elem.length > 0) elem[0].remove();
              // this.autoRotate = false;
              if (mapFeatures[key] == "standard") {
                // if (document.body.classList.contains("dark")) {
                //   this.map.setStyle("mapbox://styles/mapbox/dark-v9");
                // } else {
                //   this.map.setStyle("mapbox://styles/mapbox/streets-v9");
                // }
                this.layerControl.setType(LayerType.Standard)
              } else if (mapFeatures[key] == "selection") {
                // this.map.addControl(this.styleSwitcherControl);
                this.layerControl.setType(LayerType.Selection)

              } else if (mapFeatures[key] == "sat") {
                // //this.map.setStyle("mapbox://styles/mapbox/satellite-v9");
                // this.map.addLayer({
                //   id: "satellite",
                //   source: {
                //     type: "raster",
                //     url: "mapbox://mapbox.satellite",
                //     tileSize: 256
                //   },
                //   type: "raster"
                // });
                this.layerControl.setType(LayerType.Satellite)

              } else if (mapFeatures[key] == "sat-button") {
                // TODO: implememt
                this.layerControl.setType(LayerType.SatelliteButton)
              } else if (mapFeatures[key] == "sat-swipe") {
                this.swipe = true;
                this.changeDetectorRef.detectChanges();
                // const satMap = new mapboxgl.Map({
                // container: this.swipeMapContainer.nativeElement,
                //   style: "mapbox://styles/mapbox/satellite-v9",
                //   center: [8, 51.8],
                //   zoom: 2
                // });
                // new MapboxCompare(this.map, satMap);
                this.layerControl.setType(LayerType.Swipe, this.swipeMapContainer)
              } else if (mapFeatures[key] == "3D") {
                // this.autoRotate = true;
                // addEventListener("deviceorientation", this._orientTo, false);
                // this._add3DBuildingsLayer();
                this.layerControl.setType(LayerType.ThreeDimension)
              } else if (mapFeatures[key] == "3D-button") {
                // this._add3DBuildingsLayer();
                this.layerControl.setType(LayerType.ThreeDimensionButton)
              }
              break;
            case "position":
              if (mapFeatures[key] == "none") {
                // TODO: implement ?
              } else if (mapFeatures[key] == "true") {
                this.map.addControl(this.geolocateControl);
                setTimeout(() => {
                  this.geolocateControl.trigger();
                }, 500);
              } else if (mapFeatures[key] == "button") {
                // TODO: implement
              } else if (mapFeatures[key] == "start") {
                // TODO: implement
              }
              break;
            case "direction":
              this.directionArrow = false;
              if (mapFeatures[key] == "none") {
                // TODO: implement ?
              } else if (mapFeatures[key] == "true") {
                this.viewDirectionControl.setType(ViewDirectionType.Continuous)
              } else if (mapFeatures[key] == "button") {
                // TODO: implement
              } else if (mapFeatures[key] == "start") {
                // TODO: implement
              }
              break;
            case "track":
              if (mapFeatures[key]) {
                this.track = true;
              } else {
                this.track = false;
              }
              break;
            case "streetSection":
              if (mapFeatures[key]) {
                this.streetSectionControl.setType(StreetSectionType.Enabled)
                // this.streetSection = true;
              } else {
                this.streetSectionControl.setType(StreetSectionType.Disabled)
                // this.streetSection = false;
              }
              break;
            case "landmarks":
              if (mapFeatures[key]) {
                this.landmarkControl.setLandmark(mapFeatures.landmarkFeatures)
              }
              // this.map.addLayer({
              //   id: "landmarks",
              //   type: "fill-extrusion",
              //   source: {
              //     type: "geojson",
              //     data: mapFeatures.landmarkFeatures
              //   },
              //   paint: {
              //     "fill-extrusion-color": "#ffff00",
              //     "fill-extrusion-opacity": 0.5,
              //     "fill-extrusion-height": 9999
              //   }
              // });
              break;
          }
        }
      }
    }
  }

  // _add3DBuildingsLayer(): void {
  //   // Add 3D buildungs
  //   // Insert the layer beneath any symbol layer.
  //   var layers = this.map.getStyle().layers;

  //   var labelLayerId;
  //   for (var i = 0; i < layers.length; i++) {
  //     if (layers[i].type === "symbol" && layers[i].layout["text-field"]) {
  //       labelLayerId = layers[i].id;
  //       break;
  //     }
  //   }

  //   this.map.addLayer(
  //     {
  //       id: "3d-buildings",
  //       source: "composite",
  //       "source-layer": "building",
  //       filter: ["==", "extrude", "true"],
  //       type: "fill-extrusion",
  //       minzoom: 15,
  //       paint: {
  //         "fill-extrusion-color": "#aaa",

  //         // use an 'interpolate' expression to add a smooth transition effect to the
  //         // buildings as the user zooms in
  //         "fill-extrusion-height": [
  //           "interpolate",
  //           ["linear"],
  //           ["zoom"],
  //           15,
  //           0,
  //           15.05,
  //           ["get", "height"]
  //         ],
  //         "fill-extrusion-base": [
  //           "interpolate",
  //           ["linear"],
  //           ["zoom"],
  //           15,
  //           0,
  //           15.05,
  //           ["get", "min_height"]
  //         ],
  //         "fill-extrusion-opacity": 0.6
  //       }
  //     },
  //     // labelLayerId
  //   );
  // }

  _toGeoJSONPoint = (lng, lat): GeoJSON.Feature<GeoJSON.Point> =>
    JSON.parse(`
  {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [${lng}, ${lat}]
    }
  }`);

  /**
   * Shuffles array in place. ES6 version
   * @param {Array} a items An array containing the items.
   */
  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
