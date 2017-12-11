import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AppConfig } from './../../app/app.config';

declare var AMap; //地图声明
var points = [{"lnglat":["113.864691","22.942327"]},{"lnglat":["113.370643","22.938827"]},{"lnglat":["112.985037","23.15046"]},{"lnglat":["110.361899","20.026695"]},{"lnglat":["121.434529","31.215641"]},{"lnglat":["120.682502","28.011099"]},{"lnglat":["126.687123","45.787618"]},{"lnglat":["103.970724","30.397931"]},{"lnglat":["117.212164","31.831641"]},{"lnglat":["121.411101","31.059407"]},{"lnglat":["104.137953","30.784276"]},{"lnglat":["120.499683","30.042305"]},{"lnglat":["108.94686","34.362975"]},{"lnglat":["112.873295","22.920901"]},{"lnglat":["113.373916","23.086728"]},{"lnglat":["113.250159","23.075847"]},{"lnglat":["116.675933","39.986343"]},{"lnglat":["120.75997","31.734934"]},{"lnglat":["118.314741","32.26999"]},{"lnglat":["111.723311","34.771838"]},{"lnglat":["119.537126","26.200017"]},{"lnglat":["113.830123","23.00734"]},{"lnglat":["119.273795","26.060002"]},{"lnglat":["116.466752","39.951042"]},{"lnglat":["114.20716","22.777829"]},{"lnglat":["126.118338","45.11481"]},{"lnglat":["116.366324","39.781077"]},{"lnglat":["120.377998","31.578216"]},{"lnglat":["116.611935","23.66941"]},{"lnglat":["103.787344","30.940037"]},{"lnglat":["112.911223","23.164952"]},{"lnglat":["121.946335","39.403784"]},{"lnglat":["120.172545","36.009391"]},{"lnglat":["126.609854","45.722514"]},{"lnglat":["120.531699","32.402873"]},{"lnglat":["118.914313","32.013572"]},{"lnglat":["126.597762","45.739299"]},{"lnglat":["106.540999","29.520217"]},{"lnglat":["114.033057","22.733424"]},{"lnglat":["104.041129","30.598338"]},{"lnglat":["119.917693","32.484184"]},{"lnglat":["118.371124","35.082682"]},{"lnglat":["120.926368","31.320681"]},{"lnglat":["120.355238","31.557524"]},{"lnglat":["101.775209","36.614975"]},{"lnglat":["114.499404","34.646022"]},{"lnglat":["118.087516","24.474988"]},{"lnglat":["104.638952","30.1253"]},{"lnglat":["116.492237","39.991802"]},{"lnglat":["112.898903","32.04371"]},{"lnglat":["114.104018","22.626803"]},{"lnglat":["119.969664","30.26186"]},{"lnglat":["119.530013","39.935889"]},{"lnglat":["77.254607","39.050215"]},{"lnglat":["117.085608","36.652113"]},{"lnglat":["120.292808","30.299244"]},{"lnglat":["114.397917","23.545706"]},{"lnglat":["120.273933","30.236666"]},{"lnglat":["121.622443","31.152955"]},{"lnglat":["116.417093","39.96918"]},{"lnglat":["113.799453","22.724031"]},{"lnglat":["123.264175","41.768478"]},{"lnglat":["120.626128","30.822477"]},{"lnglat":["115.826361","33.812392"]},{"lnglat":["106.561797","26.579832"]},{"lnglat":["117.285766","34.806079"]},{"lnglat":["111.035766","21.535775"]},{"lnglat":["115.701728","24.066784"]},{"lnglat":["104.061447","30.67089"]},{"lnglat":["121.123465","31.134162"]},{"lnglat":["104.039519","30.719365"]},{"lnglat":["116.625662","39.619879"]},{"lnglat":["108.20204","28.004321"]},{"lnglat":["113.606513","34.807402"]},{"lnglat":["120.213822","30.112851"]},{"lnglat":["120.727637","27.798264"]},{"lnglat":["116.452761","39.951122"]},{"lnglat":["119.555363","39.932751"]},{"lnglat":["120.227111","30.347169"]},{"lnglat":["113.377157","31.797137"]},{"lnglat":["113.334007","23.107744"]},{"lnglat":["112.641848","22.362319"]},{"lnglat":["102.672195","24.974215"]}];


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
        zoom: 3, //设置地图缩放级别
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

    //聚合点样式
    console.log(points);
    var cluster, markers = [];
    for (var i = 0; i < points.length; i += 1) {
      markers.push(new AMap.Marker({
        position: points[i]['lnglat'],
        //content: '<div style="background-color: hsla(180, 100%, 50%, 0.7); height: 24px; width: 24px; border: 1px solid hsl(180, 100%, 40%); border-radius: 12px; box-shadow: hsl(180, 100%, 50%) 0px 0px 1px;"></div>',
        offset: new AMap.Pixel(-15, -15)
      }))
    }
    var count = markers.length;
    var _renderCluserMarker = function (context) {
      var factor = Math.pow(context.count / count, 1 / 18)
      var div = document.createElement('div');
      var Hue = 360 - factor * 180;
      var bgColor = 'hsla(' + Hue + ',100%,50%,0.5)';
      var fontColor = 'hsla(' + Hue + ',100%,20%,1)';
      var borderColor = 'hsla(' + Hue + ',100%,40%,1)';
      var shadowColor = 'hsla(' + Hue + ',100%,50%,1)';
      div.style.backgroundColor = bgColor
      var size = Math.round(30 + Math.pow(context.count / count, 1 / 5));
      div.style.width = div.style.height = size + 'px';
      div.style.border = 'solid 1px ' + borderColor;
      div.style.borderRadius = size / 2 + 'px';
      div.style.boxShadow = '0 0 1px ' + shadowColor;
      div.innerHTML = context.count;
      div.style.lineHeight = size + 'px';
      div.style.color = fontColor;
      div.style.fontSize = '14px';
      div.style.textAlign = 'center';
      context.marker.setOffset(new AMap.Pixel(-size / 2, -size / 2));
      context.marker.setContent(div)
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
      marker.setAnimation('AMAP_ANIMATION_BOUNCE'); // 设置点标记的动画效果，此处为弹跳效果
    }

    function pinMoving(e) {
      console.log(map.getCenter());
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
          var sts = [{
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


