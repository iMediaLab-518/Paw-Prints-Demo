//import { Component } from '@angular/core';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AppConfig } from './../../app/app.config';

declare var AMap; //地图声明

@Component({
  selector: 'page-home',
  templateUrl: './home.html'
})
export class HomePage {
  @ViewChild('map_container') map_container: ElementRef;

  constructor(public navCtrl: NavController) {

  }

  ionViewDidEnter() {
    var map = new AMap.Map(this.map_container.nativeElement, {
      mapStyle: 'amap://styles/macaron',
      view: new AMap.View2D({ //创建地图二维视口
        //position:, 默认为中心点
        zoom: 11, //设置地图缩放级别
        rotateEnable: true,
        resizeEnable: true,
        showBuildingBlock: true,
        zoomEnable: true
      }),
    });
    //加载IP定位插件
    map.plugin(["AMap.CitySearch"], function () {
      //实例化城市查询类
      var citysearch = new AMap.CitySearch();
      //自动获取用户IP，返回当前城市
      citysearch.getLocalCity();
      AMap.event.addListener(citysearch, "complete", function (result) {
        if (result && result.city && result.bounds) {
          var cityinfo = result.city;
          var citybounds = result.bounds;
          console.log("您当前所在城市：" + cityinfo + "");
          AppConfig.getCity(cityinfo);
          //地图显示当前城市
          map.setBounds(citybounds);
        }
        else {
          console.log("您当前所在城市：" + result.info + "");
          AppConfig.getCity(result.info);
        }
      });
      AMap.event.addListener(citysearch, "error", function (result) { alert(result.info); });
    });

    var infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -25) //窗口偏移
    });

    var marker = new AMap.Marker({
      map: map
    });
    marker.content = '我是地图中心点图钉 ^_^';

    /***** 事件注册 *****/
    marker.on('click', markerClick);
    map.on('movestart', pinUp);
    map.on('mapmove', pinMoving);
    map.on('moveend', pinDown);
    /******************/

    function pinUp(e) {
      marker.setClickable(false);
      marker.setAnimation('AMAP_ANIMATION_BOUNCE'); // 设置点标记的动画效果，此处为弹跳效果
    }

    function pinMoving(e) {
      //console.log(map.getCenter());
      marker.setPosition(map.getCenter());
    }

    function pinDown(e) {
      marker.setClickable(true);
      marker.setAnimation('AMAP_ANIMATION_NONE'); // 取消点标记的动画效果l.
      marker.setPosition(map.getCenter()); //纠正缓动中心点位置
    }

    function markerClick(e) {
      infoWindow.setContent(e.target.content);
      infoWindow.open(map, e.target.getPosition());
    }
  }

  onClick1() {
    console.log("Repo:" + AppConfig.getAppInfo("这是全局储存的信息"));
  }
  onClick2() {
    console.log("Repo:" + AppConfig.getAppInfo(null));
  }
}


