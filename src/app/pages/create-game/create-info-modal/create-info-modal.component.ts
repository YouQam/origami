import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from "@ionic/angular";
import { Plugins, CameraResultType, CameraSource } from '@capacitor/core';
import { MapFeaturesModalPage } from './../map-features-modal/map-features-modal.page';
import { environment } from 'src/environments/environment';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuestionType, AnswerType } from 'src/app/models/types';
import { standardMapFeatures } from 'src/app/models/standardMapFeatures';
import { cloneDeep } from 'lodash';



@Component({
  selector: 'app-create-info-modal',
  templateUrl: './create-info-modal.component.html',
  styleUrls: ['./create-info-modal.component.scss'],
})
export class CreateInfoModalComponent implements OnInit {

  @Input() task: any;

  uploading: boolean = false;

  constructor(
    public modalController: ModalController,
    private transfer: FileTransfer,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    if (this.task == null) {
      this.task = {
        category: 'info',
        question: {
          type: QuestionType.INFO,
          text: '',
          photo: '',
        },
        answer: {
          type: AnswerType.INFO,
        },
        settings: {
          confirmation: true
        },
        mapFeatures: null,
      }
    }
  }

  async capturePhoto(library: boolean = false) {

    const image = await Plugins.Camera.getPhoto({
      quality: 50,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: library ? CameraSource.Photos : CameraSource.Camera,
      width: 500
    });

    this.task.question.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image.webPath);

    this.uploading = true;

    const fileTransfer: FileTransferObject = this.transfer.create();
    fileTransfer.upload(image.path, `${environment.apiURL}/upload`).then(res => {
      console.log(JSON.parse(res.response))
      const filename = JSON.parse(res.response).filename
      this.task.question.photo = `${environment.apiURL}/file/${filename}`
      this.uploading = false;
    })
      .catch(err => {
        console.log(err)
        this.uploading = false;
      })
  }

  async presentMapFeaturesModal() {
    const modal = await this.modalController.create({
      component: MapFeaturesModalPage,
      backdropDismiss: false,
      componentProps: {
        features: this.task.mapFeatures
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    this.task.mapFeatures = data.data
    return;
  }

  dismissModal(dismissType: string = 'null') {
    if (this.uploading) {
      return;
    }
    if (dismissType == "close") {
      this.modalController.dismiss();
      return;
    }

    if (this.task.mapFeatures == undefined) {
      this.task.mapFeatures = cloneDeep(standardMapFeatures)
    }

    this.modalController.dismiss({
      dismissed: true,
      data: this.task
    });
  }

}
