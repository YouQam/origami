import { Component, OnInit } from '@angular/core';
import { IBeacon, IBeaconPluginResult } from '@ionic-native/ibeacon/ngx';

@Component({
  selector: 'app-detect-beacon',
  templateUrl: './detect-beacon.page.html',
  styleUrls: ['./detect-beacon.page.scss'],
})
export class DetectBeaconPage {
  private isAdvertisingAvailable: boolean = null;

  beaconUuid: string = 'b9407f30-f5f8-466e-aff9-25556b57fe6d';
  beaconData : any;
  length: number = -1;
  beaconFound: boolean = false;

  constructor(private readonly ibeacon: IBeacon) {
    this.enableDebugLogs();
  }

  public enableDebugLogs(): void {
    
      this.ibeacon.enableDebugLogs();
      this.ibeacon.enableDebugNotifications();
  }

  public onStartClicked(): void {
      this.startBleFun();
            setTimeout(function(){
              console.log('timeout')
            }, 5000);
            if (!this.beaconFound) {
              this.startBleFun();
            }

/*       setInterval(() => {
        this.startBleFun();
        console.log('inteval');
      }, 3 * 1000); */
  }

  public startBleFun(): void {

    // Request permission to use location on iOS
    this.ibeacon.requestAlwaysAuthorization();

    // create a new delegate and register it with the native layer
    let delegate = this.ibeacon.Delegate();

    this.ibeacon.setDelegate(delegate);

    // Subscribe to some of the delegate's event handlers
    delegate.didRangeBeaconsInRegion().
      subscribe(
        (pluginResult: IBeaconPluginResult) => {
          console.log('didRangeBeaconsInRegion: ', pluginResult)
          this.beaconData = pluginResult.beacons[0];
          this.beaconFound = true;
        },
        (error: any) => console.error(`Failure during ranging: `, error)
      );

    delegate.didStartMonitoringForRegion().
      subscribe(
        (pluginResult: IBeaconPluginResult) =>
          console.log('didStartMonitoringForRegion: ', pluginResult)
        ,
        (error: any) => console.error(`Failure during starting of monitoring: `, error)
      );

    delegate.didEnterRegion()
      .subscribe(
        data => {
          console.log('didEnterRegion: ', data);
          this.length = 100;
          this.beaconData = data;
        }
      );

    delegate.didExitRegion().subscribe(
      (pluginResult: IBeaconPluginResult) => {
        console.log('didExitRegion: ', pluginResult);
      }
    );

    console.log(`Creating BeaconRegion with UUID of: `, this.beaconUuid);

    // uuid is required, identifier and range are optional.
    const beaconRegion = this.ibeacon.BeaconRegion('EST3', this.beaconUuid, 24489, 35011);

    this.ibeacon.startMonitoringForRegion(beaconRegion).
      then(
        () => console.log('Native layer recieved the request to monitoring'),
        (error: any) => console.error('Native layer failed to begin monitoring: ', error)
      );

    this.ibeacon.startRangingBeaconsInRegion(beaconRegion)
      .then(() => {
        console.log(`Started ranging beacon region: `, beaconRegion);
      })
      .catch((error: any) => {
        console.error(`Failed to start ranging beacon region: `, beaconRegion);
      });
  }

}