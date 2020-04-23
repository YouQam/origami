import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DetectBeaconPage } from './detect-beacon.page';

describe('DetectBeaconPage', () => {
  let component: DetectBeaconPage;
  let fixture: ComponentFixture<DetectBeaconPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectBeaconPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DetectBeaconPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
