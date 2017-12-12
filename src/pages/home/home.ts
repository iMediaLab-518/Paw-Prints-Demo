import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AppConfig } from './../../app/app.config';
import { POINTS } from './../../app/points';


@Component({
  selector: 'page-home',
  templateUrl: './home.html'
})
export class HomePage {
  @ViewChild('map_container') map_container: ElementRef;

  constructor(public navCtrl: NavController) {

  }

  ionViewDidLoad() {
    let points = POINTS;
    
    let map = new AMap.Map(this.map_container.nativeElement, {
      mapStyle: 'amap://styles/45f13eb0ee5aa9cf0a01e92293754bdd',
      view: new AMap.View2D({ //创建地图二维视口
        //position:, 默认为中心点
        zoom: 5, //设置地图缩放级别
        resizeEnable: true
      }),
    });
    //加载IP定位插件
    map.plugin(["AMap.CitySearch"], function () {
      //实例化城市查询类
      let citysearch = new AMap.CitySearch();
      //自动获取用户IP，返回当前城市
      citysearch.getLocalCity();
      AMap.event.addListener(citysearch, "complete", function (result) {
        if (result && result.city && result.bounds) {
          let cityinfo = result.city;
          let citybounds = result.bounds;
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

    let infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -25) //窗口偏移
    });

    let marker = new AMap.Marker({
      map: map
    });
    marker.content="中心点";

    //聚合点样式
    console.log(points);
    let cluster, markers = [];
    for (let i = 0; i < points.length; i += 1) {
      markers.push(new AMap.Marker({
        position: points[i]['lnglat'],
        content:'<div style="background-color: rgb(255, 255, 255); height: 20px; width: 20px; border: 1px solid rgb(255, 255, 255); border-radius: 12px; box-shadow: rgb(158, 158, 158) 0px 1px 4px; margin: 0px 0 0 0px;"></div><div style="background-color: rgb(82, 150, 243); height: 16px; width: 16px; border: 1px solid rgb(82, 150, 243); border-radius: 15px; box-shadow: rgb(158, 158, 158) 0px 0px 2px; margin: -18px 0 0 2px; "></div>',
        offset: new AMap.Pixel(-15, -15)
      }))
    }
    let count = markers.length;
    let _renderCluserMarker = function (context) {
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
    //生成聚合点
    addCluster(2);

    /***** 事件注册 *****/
    marker.on('click', markerClick);
    map.on('movestart', pinUp);
    map.on('mapmove', pinMoving);
    map.on('moveend', pinDown);
    /******************/

    function pinUp(e) {
      marker.setClickable(false);
      //marker.setAnimation('AMAP_ANIMATION_BOUNCE'); // 设置点标记的动画效果，此处为弹跳效果
    }

    function pinMoving(e) {
      console.log(map.getCenter());
      marker.setPosition(map.getCenter());
    }

    function pinDown(e) {
      marker.setClickable(true);
      //marker.setAnimation('AMAP_ANIMATION_NONE'); // 取消点标记的动画效果l.
      marker.setPosition(map.getCenter()); //纠正缓动中心点位置
    }

    function markerClick(e) {
      infoWindow.setContent(e.target.content);
      infoWindow.open(map, e.target.getPosition());
    }

    //点聚合算法
    function addCluster(tag) {
      if (cluster) {
          cluster.setMap(null);
      }
      if (tag == 2) {//完全自定义
        map.plugin(["AMap.MarkerClusterer"],function(){ 
          cluster = new AMap.MarkerClusterer(map,markers,{
              gridSize:50,
              renderCluserMarker:_renderCluserMarker
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
          },{
              url: "http://a.amap.com/jsapi_demos/static/images/red.png",
              size: new AMap.Size(48, 48),
              offset: new AMap.Pixel(-24, -24)
          },{
              url: "http://a.amap.com/jsapi_demos/static/images/darkRed.png",
              size: new AMap.Size(48, 48),
              offset: new AMap.Pixel(-24, -24)
          }];
          map.plugin(["AMap.MarkerClusterer"],function(){ 
          cluster = new AMap.MarkerClusterer(map, markers, {
              styles: sts,
              gridSize:80
          });
        });
      } else {//默认样式
        map.plugin(["AMap.MarkerClusterer"],function(){ 
          cluster = new AMap.MarkerClusterer(map, markers,{gridSize:80});
        });
      }
    }
  }

  onClick1() {
    console.log("Repo:" + AppConfig.getAppInfo("这是全局储存的信息"));
  }
  onClick2() {
    console.log("Repo:" + AppConfig.getAppInfo(null));
  }
}


