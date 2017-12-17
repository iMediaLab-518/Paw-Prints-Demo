import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, AlertController, Platform, LoadingController, Loading } from 'ionic-angular';
import {MapService} from "./map.service";
import {Observable} from 'rxjs/observable';

import { AppConfig } from './../../app/app.config';

@Component({
  selector: 'page-home',
  templateUrl: './home.html'
})
export class HomePage {
  loader: Loading;
  loader_locate: Loading;
  private localized: boolean = false;

  constructor(public navCtrl: NavController,
    protected alertCtrl: AlertController,
    private platform: Platform,
    private mapService: MapService,
    private loadingCtrl: LoadingController) {

  }

  /***
   * 地图加载完毕
   */
  onMapReady() {
    this.loader.dismiss();
    console.log("onMapReady");
    const mapElement: Element = this.mapService.mapElement;
    mapElement.classList.add('show-map');
    
    const loader_locate = this.loadingCtrl.create({
      content: "获取定位中...",
      spinner: "crescent",
      showBackdrop: true
    });
    this.loader_locate = loader_locate;
    loader_locate.present();
    
    this.platform.ready().then(() => {
      this.locate().subscribe(() => {
        console.log("定位成功");
        if (mapElement) {
          console.log("显示当前位置");
        }
      }, error => {
        console.log(error);
      });
    });
  }

  /**
   * 获取当前定位
   */
  private locate(): Observable<any> {
    return new Observable((sub:any) => {
      this.mapService.displayCurrentPosition().subscribe(data => {
        console.log("displayCurrentPosition success");
        this.loader_locate.dismiss();
        this.localized = true;
        // Vibrate the device for a second
        // Vibration.vibrate(1000);
        sub.next(data);
        sub.complete();
      }, error => {
        sub.error(error);
        this.loader_locate.dismiss();
        this.alertNoGps();
      });
    });
  }


  /**
   * 出错提示
   */
  private alertNoGps() {
    const alert = this.alertCtrl.create({
      title: '错误',
      subTitle: '系统定位服务不可用,请到设置里面开启!',
      enableBackdropDismiss: false,
      buttons: [{
        text: '好的',
        handler: () => {
        }
      }]
    });
    alert.present();
  }


  displayCircle() {
    this.platform.ready().then(() => {
      this.mapService.showRegionalInfo().subscribe(() => {
        console.log("draw circle");
      }, error => {
        console.log(error);
      });
    });
  }

  /***
   * 按下‘+’按钮
   * 
   */
  onClick1(): void {
    //存入全局配置信息
    console.log("Repo:" + AppConfig.getAppInfo("这是全局储存的信息"));
  }

  /***
   * 按下‘-’按钮
   * 
   */
  onClick2(): void {
    //取出全局配置信息
    console.log("Repo:" + AppConfig.getAppInfo(null));
  }


  ionViewDidLoad(): void {
    const loader = this.loadingCtrl.create({
      content: "加载中...",
      spinner: "crescent",
      showBackdrop: true
    });
    this.loader = loader;
    loader.present();
  }

  /***
   * ionic 视图加载成功
   *
   */
  ionViewDidEnter(): void {
  }

}


