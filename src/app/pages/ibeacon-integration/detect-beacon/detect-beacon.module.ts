import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DetectBeaconPage } from './detect-beacon.page';

const routes: Routes = [
  {
    path: '',
    component: DetectBeaconPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DetectBeaconPage]
})
export class DetectBeaconPageModule {}
