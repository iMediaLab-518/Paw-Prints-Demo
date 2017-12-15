import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, AlertController, Platform, LoadingController, Loading } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { MapConst } from './map.const';

import { AppConfig } from './../../app/app.config';
import { POINTS } from './../../app/points';

export interface MapOptions {
  mapStyle: string;
  lat: number;
  lon: number;
  zoom: number;
}

@Component({
  selector: 'page-home',
  templateUrl: './home.html'
})
export class HomePage {
  @ViewChild('map_container') map_container: ElementRef;
  loader: Loading;
  private localized: boolean = false;
  public map = null;
  public element: Element = null;

  constructor(public navCtrl: NavController,
    protected alertCtrl: AlertController,
    private platform: Platform,
    private loadingCtrl: LoadingController) {

  }

  /***
   * 创建地图
   * @returns {Promise}
   */
  public initMap(mapEl: Element, opts: MapOptions = {
    mapStyle: MapConst.DEFAULT_MAPSTYLE,
    lat: MapConst.DEFAULT_LAT,
    lon: MapConst.DEFAULT_LNG,
    zoom: MapConst.DEFAULT_ZOOM
  }): Promise<any> {
    this.element = mapEl;
    console.log("createMap...");

    return new Promise((resolve: Function) => {
      () => {
        console.log("loadMap success");
        let map = new AMap.Map(mapEl, {
          mapStyle: opts.mapStyle,
          view: new AMap.View2D({
            //position: [opts.lon, opts.lat],
            resizeEnable: true,
            zoom: opts.zoom
          })
        });

        this.map = map;
        resolve(this.map);
      }
    });
  }

  /***
   * 调用 AMap.Geolocation 获取当前位置
   * @returns {Observable}
   */
  public getGeolocationByAMap(): Observable<any> {
    return new Observable((sub: any) => {
      console.log("getGeolocationByAMap");
      let geolocation;
      let map = this.map;
      map.plugin('AMap.Geolocation', function () {
        geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,//是否使用高精度定位，默认:true
          timeout: 5000,          //超过 5000ms 后停止定位，默认：无穷大
          buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
          // zoomToAccuracy: true,      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
          buttonPosition: 'LB',
          showCircle: true,        //定位成功后用圆圈表示定位精度范围，默认：true
          panToLocation: true
        });
        map.addControl(geolocation);
        geolocation.getCurrentPosition();

        AMap.event.addListener(geolocation, 'complete', (data) => {
          console.log("geolocation complete");

          this.loader.dismiss();
          this.localized = true;

          // 存储当前城市
          localStorage.setItem('citycode', data.addressComponent.citycode);
          localStorage.setItem('city', data.addressComponent.city);
          sub.next(data);
          sub.complete();
        });
        AMap.event.addListener(geolocation, 'error', (error) => {
          console.log("geolocation error" + error);
          sub.error(error);
          this.loader.dismiss();
          this.alertNoGps();
        });
      });
    });
  }

  /***
   * 地图加载完毕
   */
  onMapReady() {
    console.log("onMapReady");
    this.platform.ready().then(() => {
      this.getGeolocationByAMap().subscribe(() => {
        console.log("定位成功");
        const mapElement: Element = this.map_container.nativeElement;
        if (mapElement) {
          console.log("显示当前位置");
          mapElement.classList.add('show-map');
        }
      }, error => {
        console.log(error);
      });
    });
  }

  /**
   * 定位出错提示
   */
  private alertNoGps() {
    const alert = this.alertCtrl.create({
      title: '错误',
      subTitle: '定位服务不可用,请到设置里面开启!',
      enableBackdropDismiss: false,
      buttons: [{
        text: '好的',
        handler: () => {
        }
      }]
    });
    alert.present();
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
    var self = this;  //防止 this 指针丢失的笨方法，待改进

    let points = POINTS;
    let cluster, markers = [];
    let circle = null;
    let clickListener = null;

    let map = new AMap.Map(this.map_container.nativeElement, {
      mapStyle: 'amap://styles/45f13eb0ee5aa9cf0a01e92293754bdd',
      view: new AMap.View2D({ //创建地图二维视口
        //position:, 默认为中心点
        zoom: 10, //设置地图缩放级别
        resizeEnable: true
      }),
    });
    this.loader.dismiss();
    console.log("Zoom:" + map.getZoom());
    // //加载IP定位插件
    // map.plugin(["AMap.CitySearch"], function () {
    //   //实例化城市查询类
    //   let citysearch = new AMap.CitySearch();
    //   //自动获取用户IP，返回当前城市
    //   citysearch.getLocalCity();
    //   AMap.event.addListener(citysearch, "complete", function (result) {
    //     if (result && result.city && result.bounds) {
    //       let cityinfo = result.city;
    //       let citybounds = result.bounds;
    //       console.log("您当前所在城市：" + cityinfo + "");
    //       AppConfig.getCity(cityinfo);
    //       //地图显示当前城市
    //       map.setBounds(citybounds);
    //     }
    //     else {
    //       console.log("您当前所在城市：" + result.info + "");
    //       AppConfig.getCity(result.info);
    //     }
    //   });
    //   AMap.event.addListener(citysearch, "error", function (result) { alert(result.info); });
    // });

    let infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -25) //窗口偏移
    });

    let Pin = new AMap.Marker({
      map: map,
      extData: '中心点'
    });
    console.log(Pin.getExtData());

    circle = new AMap.Circle({
      center: map.getCenter(),// 圆心位置
      radius: map.getScale() / 15, //半径
      bubble: true, //冒泡点击事件到 map
      strokeColor: "#F33", //线颜色
      strokeOpacity: 1, //线透明度
      strokeWeight: 0.8, //线粗细度
      fillColor: "#ffffff", //填充颜色
      fillOpacity: 0//填充透明度
    });
    circle.setMap(map);

    console.log(points);

    // for (let i = 0; i < points.length; i += 1) {
    //   markers.push(new AMap.Marker({
    //     position: points[i]['lnglat'],
    //     content: '<div style="background-color: rgb(255, 255, 255); height: 20px; width: 20px; border: 1px solid rgb(255, 255, 255); border-radius: 12px; box-shadow: rgb(158, 158, 158) 0px 1px 4px; margin: 0px 0 0 0px;"></div><div style="background-color: rgb(82, 150, 243); height: 16px; width: 16px; border: 1px solid rgb(82, 150, 243); border-radius: 15px; box-shadow: rgb(158, 158, 158) 0px 0px 2px; margin: -18px 0 0 2px; "></div>',
    //     offset: new AMap.Pixel(-15, -15)
    //   }));
    // }

    /***** 事件注册 *****/
    Pin.on('click', markerClick);
    map.on('complete', mapChange);
    map.on('movestart', pinUp);
    map.on('mapmove', pinMoving);
    map.on('moveend', pinDown);
    map.on('moveend', mapChange);
    map.on('mousemove', mapShowLine);
    map.on('dblclick', mapDoubleClick);
    /******************/

    function pinUp(e: any): void {
      Pin.setClickable(false);
      //Pin.setOffset(new AMap.Pixel(-25, 0));
    }

    function pinMoving(e: any): void {
      //console.log(map.getCenter());
      Pin.setPosition(map.getCenter());
    }

    function pinDown(e: any): void {
      Pin.setClickable(true);
      Pin.setAnimation('AMAP_ANIMATION_DROP'); // 设置点标记的动画效果，此处为下坠效果
      Pin.setPosition(map.getCenter()); //纠正缓动中心点位置
    }

    function markerClick(e: any): void {
      map.setFitView();

      //Alert 消息弹窗
      let alert = self.alertCtrl.create({
        title: 'Infomation',
        subTitle: Pin.getExtData(),
        buttons: ['OK']
      });
      alert.present();

      infoWindow.setContent(Pin.getExtData());
      infoWindow.open(map, Pin.getPosition());
    }

    function _onClick(e: any): void {
      map.setFitView();

      console.log("Did");
      console.log(e);
      console.log(e.lnglat);

      //Alert 消息弹窗
      let alert = self.alertCtrl.create({
        title: 'Marker Infomation',
        subTitle: e.target.getExtData(),
        buttons: ['OK']
      });
      alert.present();
      //infoWindow.setContent(e.target.getExtData());
      //infoWindow.open(map, [e.lnglat.getLng(), e.lnglat.getLat()]);
    }

    function mapShowLine(e: any): void {
      let lineArrX = [
        [e.lnglat.getLng(), 0],
        [e.lnglat.getLng(), 180],
        [e.lnglat.getLng(), -180]
      ];

      let lineArrY = [
        [0, e.lnglat.getLat()],
        [180, e.lnglat.getLat()],
        [-180, e.lnglat.getLat()]
      ];

      let polyline_x = new AMap.Polyline({
        path: lineArrX,          //设置线覆盖物路径
        strokeColor: "#3366FF", //线颜色
        strokeOpacity: 1,       //线透明度
        strokeWeight: 1,        //线宽
        strokeStyle: "solid",   //线样式
        strokeDasharray: [10, 5] //补充线样式
      });
      let polyline_y = new AMap.Polyline({
        path: lineArrY,          //设置线覆盖物路径
        strokeColor: "#3366FF", //线颜色
        strokeOpacity: 1,       //线透明度
        strokeWeight: 1,        //线宽
        strokeStyle: "solid",   //线样式
        strokeDasharray: [10, 5] //补充线样式
      });
      //polyline_x.setMap(map);
      //polyline_y.setMap(map);

    }

    function mapDoubleClick(e: any): void {
      console.log([e.lnglat.getLng(),e.lnglat.getLat()])
      map.setCenter([e.lnglat.getLng(),e.lnglat.getLat()]);
    }

    function mapChange(e: any): void {
      //点数组初始化
      markers = [];
      if (clickListener) {
        AMap.event.removeListener(clickListener);
      }
      //点筛选
      for (let i = 0; i < points.length; i += 1) {
        //let diff_X = Math.abs(parseFloat(points[i]['lnglat'][0]) - parseFloat(map.getCenter().lng));
        //let diff_Y = Math.abs(parseFloat(points[i]['lnglat'][1]) - parseFloat(map.getCenter().lat));
        let lnglat = new AMap.LngLat(points[i]['lnglat'][0], points[i]['lnglat'][1]);
        let distance = lnglat.distance(map.getCenter());

        if (distance <= map.getScale() / 15) {
          let temp = new AMap.Marker({
            position: lnglat,
            content: '<div style="background-color: rgb(255, 255, 255); height: 20px; width: 20px; border: 1px solid rgb(255, 255, 255); border-radius: 12px; box-shadow: rgb(158, 158, 158) 0px 1px 4px; margin: 0px 0 0 0px;"></div><div style="background-color: rgb(82, 150, 243); height: 16px; width: 16px; border: 1px solid rgb(82, 150, 243); border-radius: 15px; box-shadow: rgb(158, 158, 158) 0px 0px 2px; margin: -18px 0 0 2px; "></div>',
            offset: new AMap.Pixel(-15, -15),
            extData: '第' + i + '点'
          });
          //temp.on('click', markerClick);
          clickListener = AMap.event.addListener(temp, "click", _onClick);
          markers.push(temp);
          //markers[i].on('click', markerClick);
        }
      }

      circle.setCenter(map.getCenter());
      circle.setRadius(map.getScale() / 15);


      console.log("Zoom:" + map.getZoom());
      console.log("DPI:" + map.getScale() + "Radius:" + (map.getScale() / 10).toString());
      console.log(markers);
      let count = markers.length;
      console.log(count);
      //聚合点样式
      var _renderCluserMarker = function (context) {
        let factor = Math.pow(context.count / count, 1 / 15);
        let div = document.createElement('div');
        let Hue = 360 - factor * 180;
        let bgColor = 'hsla(' + Hue + ',100%,50%,0.5)';
        let fontColor = 'hsla(' + Hue + ',100%,20%,1)';
        let borderColor = 'hsla(' + Hue + ',100%,40%,1)';
        let shadowColor = 'hsla(' + Hue + ',100%,50%,1)';
        div.style.backgroundColor = bgColor;
        let size = Math.round(30 + Math.pow(context.count / count, 1 / 15));
        div.style.width = div.style.height = size + 'px';
        div.style.border = 'solid 0px ' + borderColor;
        div.style.borderRadius = size / 2 + 'px';
        div.style.boxShadow = '0 0 1px ' + shadowColor;
        div.innerHTML = context.count;
        div.style.lineHeight = size + 'px';
        div.style.color = fontColor;
        div.style.fontSize = '14px';
        div.style.textAlign = 'center';
        context.marker.setOffset(new AMap.Pixel(-size / 2, -size / 2));
        context.marker.setContent(div);
      }
      //绘制点与聚合点
      addCluster(2, _renderCluserMarker);
      //map.setFitView();

    }

    //点聚合
    function addCluster(tag: any, _renderCluserMarker: any): void {
      if (cluster) {
        cluster.setMap(null);
      }
      if (tag == 2) {//完全自定义
        map.plugin(["AMap.MarkerClusterer"], function () {
          cluster = new AMap.MarkerClusterer(map, markers, {
            gridSize: 50,
            renderCluserMarker: _renderCluserMarker
          });
        });
      } else if (tag == 1) {//自定义图标
        let sts = [{
          url: "http://a.amap.com/jsapi_demos/static/images/blue.png",
          size: new AMap.Size(32, 32),
          offset: new AMap.Pixel(-16, -16)
        }, {
          url: "http://a.amap.com/jsapi_demos/static/images/green.png",
          size: new AMap.Size(32, 32),
          offset: new AMap.Pixel(-16, -16)
        }, {
          url: "http://a.amap.com/jsapi_demos/static/images/orange.png",
          size: new AMap.Size(36, 36),
          offset: new AMap.Pixel(-18, -18)
        }, {
          url: "http://a.amap.com/jsapi_demos/static/images/red.png",
          size: new AMap.Size(48, 48),
          offset: new AMap.Pixel(-24, -24)
        }, {
          url: "http://a.amap.com/jsapi_demos/static/images/darkRed.png",
          size: new AMap.Size(48, 48),
          offset: new AMap.Pixel(-24, -24)
        }];
        map.plugin(["AMap.MarkerClusterer"], function () {
          cluster = new AMap.MarkerClusterer(map, markers, {
            styles: sts,
            gridSize: 80
          });
        });
      } else {//默认样式
        map.plugin(["AMap.MarkerClusterer"], function () {
          cluster = new AMap.MarkerClusterer(map, markers, { gridSize: 80 });
        });
      }
    }
  }

}


