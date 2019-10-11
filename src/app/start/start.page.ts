import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-start',
  templateUrl: './start.page.html',
  styleUrls: ['./start.page.scss'],
})
export class StartPage implements OnInit {

  playerMode: String
  playerModeDescription: String
  developerMode: String
  developerModeDescription: String
  evaluateMode: String
  evaluateModeDescription: String

  constructor(public navCtrl: NavController, public toastController: ToastController, private _translate: TranslateService) { }

  ngOnInit() {
    this._translate.setDefaultLang('de');
    this._initialiseTranslation()
  }

  _initialiseTranslation(): void {
    this._translate.get('playerMode').subscribe((res: string) => {
      this.playerMode = res;
    });
    this._translate.get('playerModeDescription').subscribe((res: string) => {
      this.playerModeDescription = res;
    });
    this._translate.get('developerMode').subscribe((res: string) => {
      this.developerMode = res;
    });
    this._translate.get('developerModeDescription').subscribe((res: string) => {
      this.developerModeDescription = res;
    });
    this._translate.get('evaluateMode').subscribe((res: string) => {
      this.evaluateMode = res;
    });
    this._translate.get('evaluateModeDescription').subscribe((res: string) => {
      this.evaluateModeDescription = res;
    });
  }

  handleCardClick(e) {
    console.log(e)
  }

  navigateGamesOverviewPage() {
    this.navCtrl.navigateForward('play-game/play-game-list');
  }

  navigateCreatePage() {
    this.navCtrl.navigateForward('create-game');
  }

  navigateShowroomPage() {
    this.navCtrl.navigateForward('map-showroom');
  }

  navigateInfoPage() {
    this.navCtrl.navigateForward('info')
  }

  async setLanguage(e) {
    this._translate.use(e.target.dataset.value);
    this._initialiseTranslation()
  }

}
