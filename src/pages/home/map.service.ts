import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Geolocation, Geoposition } from 'ionic-native';
import { MapConst } from './map.const';
import { POINTS } from './../../app/points';

export interface IMapOptions {
    mapStyle: string;
    zoom: number;
}

@Injectable()
export class MapService {
    private points = POINTS;
    private map = null;
    private element: Element = null;
    private circle = null;
    private Pin = null;
    private pinAlert = null;
    marker: Array<any> = [];
    infoMarkers: Array<any> = [];
    infoMarkersclickListener: Array<any> = [];
    windowsArr: Array<any> = [];

    constructor(protected alertCtrl: AlertController) {
    }

    /***
     * 加载js,动态创建dom到页面
     * @returns {Promise}
     */
    private loadAMapApi(): Promise<any> {
        console.log("loadAMapApi");
        const _loadScript = () => {
            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=1.4.2&key=b61fc6e26090a23374dd4fca690c1807&callback=initMap`;
            script.type = 'text/javascript';
            script.async = true;
            const s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(script, s);
        };

        return new Promise((resolve: Function) => {
            (<any>window).initMap = () => {
                console.log("initMap success");
                return resolve();
            };
            _loadScript();
        });
    }

    /***
     * 异步加载高德地图
     * @returns {Promise}
     */
    private loadMap(): Promise<any> {
        console.log("loadMap");
        return new Promise((resolve: Function, reject: Function) => {
            if ((<any>window).AMap) {
                resolve();
            } else {
                console.log("window no AMap");
                this.loadAMapApi().then(() => resolve()).catch(error => {
                    reject(error);
                });
            }
        });
    }

    /***
     * 创建地图
     * @returns {Promise}
     */
    public createMap(mapEl: Element, opts: IMapOptions = {
        mapStyle: MapConst.DEFAULT_MAPSTYLE,
        zoom: MapConst.DEFAULT_ZOOM
    }): Promise<any> {
        this.element = mapEl;
        console.log("createMap...");

        return new Promise((resolve: Function, reject: Function) => {
            this.loadMap().then(() => {
                console.log("loadMap success");
                let map = new AMap.Map(mapEl, {
                    mapStyle: opts.mapStyle,
                    view: new AMap.View2D({  //创建地图二维视口 
                        resizeEnable: true,
                        zoom: opts.zoom
                    })
                });

                this.map = map;
                resolve(this.map);

            }).catch(error => {
                reject(error);
                console.log(error);
            });
        });
    }

    /***
     * 使用Geolocation cordova plugin获取当前位置
     * @param maximumAge
     * @returns {Promise<Coordinates>}
     */
    private getCurrentPosition(maximumAge: number = 5000): Promise<Coordinates> {
        const options = {
            timeout: 5000,
            enableHighAccuracy: true,
            maximumAge
        };
        return Geolocation.getCurrentPosition(options).then((pos: Geoposition) => {
            return pos.coords;
        });
    }

    /***
     * 调用高德地图,显示当前位置
     * ref: https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
     * @param addressEl
     * @returns {Observable}
     */
    public displayCurrentPosition(): Observable<any> {
        return new Observable((sub: any) => {
            let geoAuthorized = localStorage.getItem('geoAuthorized');
            //如果已经授权,则直接调用高德地图进行定位
            if ('true' === geoAuthorized) {
                console.log("geoAuthorized");
                this.getGeolocationByAMap().subscribe(data => {
                    console.log("displayCurrentPosition complete" + data);
                    sub.next(data);
                    sub.complete();
                }, error => {
                    console.log("displayCurrentPosition error" + error);
                    sub.error(error);
                });
            } else {
                console.log("geo not Authorized");
                this.getCurrentPosition().then((coords: Coordinates) => {
                    this.getGeolocationByAMap().subscribe(data => {
                        console.log("displayCurrentPosition complete" + data);
                        sub.next(data);
                        sub.complete();
                    }, error => {
                        console.log("displayCurrentPosition error" + error);
                        sub.error(error);
                    });
                }).catch(error => {
                    console.log("displayCurrentPositionError:" + error);
                    sub.error(error);
                });
            }
        });
    }

    // /***
    //  * create Place Autocomplete
    //  * ref: https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
    //  * @param addressEl
    //  * @returns {Observable}
    //  */
    // public displayPosition(lng: number, lat: number):Observable<any> {
    //   return new Observable((sub:any) => {
    //     const lngLat = new AMap.LngLat(lng, lat);
    //     this.map.setCenter(lngLat);
    //     sub.next();
    //     sub.complete();
    //   });
    // }

    getGeolocationByAMap(): Observable<any> {
        return new Observable((sub: any) => {
            console.log("getGeolocationByAMap");
            let geolocation;
            let map = this.map;
            map.plugin('AMap.Geolocation', function () {
                geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,//是否使用高精度定位，默认:true
                    timeout: 10000,          //超过10秒后停止定位，默认：无穷大
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
                    // 存储当前城市
                    localStorage.setItem('citycode', data.addressComponent.citycode);
                    localStorage.setItem('city', data.addressComponent.city);
                    sub.next(data);
                    sub.complete();
                });
                AMap.event.addListener(geolocation, 'error', (error) => {
                    console.log("geolocation error" + error);
                    sub.error(error);
                });
            });
        });
    }

    /***
     * return map html element
     * @returns {Element}
     */
    public get mapElement(): Element {
        return this.element;
    }

    /***
     * trigger map resize event
     */
    public resizeMap(): void {
        if (this.map) {
            console.log("resizeMap");
            AMap.event.trigger(this.map, 'resize');
        }
    }

    //   /***
    //    * 获取中心点坐标
    //    * @returns {Observable}
    //    */
    //   public displayMapCenter():void {
    //     let center = new AMap.Lnglat({
    //         map: this.map
    //       }); 

    //     center= this.map.getCenter();
    //     console.log(center);
    //   }

    /***
     * 加载局部信息
     * @returns {Observable}
     */
    public showRegionalInfo(): Observable<any> {
        console.log("drawRegionalInfo");
        return new Observable((sub: any) => {
            // note:也可以加载js的时候把插件顺带加载
            // 清除所有marker
            // AMap.clear();
            //this.map.clearMap();
            this.drawVisualArea();
            this.drawPin();
            console.log("drawCircle success");
        });
    }

    /***
     * 绘制可视圈
     */
    public drawVisualArea(): any {
        let map = this.map;
        let sum = 0;
        console.log(this.infoMarkers);
        this.map.remove(this.infoMarkers);
        this.infoMarkers = [];

        if (this.circle) {
            this.circle.setCenter(map.getCenter());
            this.circle.setRadius(map.getScale() / 15);
            console.log("circle update");
        }
        else {
            let circleOption = {
                map: this.map,
                center: map.getCenter(),// 圆心位置
                radius: map.getScale() / 15, //半径
                bubble: true, //冒泡点击事件到 map
                strokeColor: "#F33", //线颜色
                strokeOpacity: 1, //线透明度
                strokeWeight: 0.8, //线粗细度
                fillColor: "#ffffff", //填充颜色
                fillOpacity: 0  //填充透明度
            };
            this.circle = new AMap.Circle(circleOption);
            console.log("circle firstly");
        }
        for (let i = 0; i < this.points.length; i += 1) {  //点筛选
            let lnglat = new AMap.LngLat(this.points[i]['lnglat'][0], this.points[i]['lnglat'][1]);
            let distance = lnglat.distance(map.getCenter());
            if (distance <= map.getScale() / 15) {
                sum += 1;
                // console.log("X:" + this.points[i]['lnglat'][0] + "Y:" + this.points[i]['lnglat'][1]);
                // let temp = new AMap.Marker({
                //     position: lnglat,
                //     content: '<div style="background-color: rgb(255, 255, 255); height: 20px; width: 20px; border: 1px solid rgb(255, 255, 255); border-radius: 12px; box-shadow: rgb(158, 158, 158) 0px 1px 4px; margin: 0px 0 0 0px;"></div><div style="background-color: rgb(82, 150, 243); height: 16px; width: 16px; border: 1px solid rgb(82, 150, 243); border-radius: 15px; box-shadow: rgb(158, 158, 158) 0px 0px 2px; margin: -18px 0 0 2px; "></div>',
                //     offset: new AMap.Pixel(-15, -15),
                //     extData: '第' + i + '点'
                // });
                //temp.on('click', markerClick);
                //clickListener = AMap.event.addListener(temp, "click", _onClick);
                //this.infoMarkers.push(temp);
                //markers[i].on('click', markerClick);
                this.addMarker(sum, this.points[i]['lnglat']);
                console.log("markers update");
            }
        }
        return this.circle;
    }

    /***
     * 绘制中心点大头针
     */
    public drawPin(): any {
        let map = this.map;
        let self = this;

        if (this.Pin) {
            //console.log(this.Pin);
            //console.log(this.Pin.getPosition());
            this.Pin.setPosition(map.getCenter());
        }
        else {
            let PinOption = {
                map: map,
                position: map.getCenter(),
                extData: '中心点'
            };
            this.Pin = new AMap.Marker(PinOption);
            AMap.event.addListener(this.Pin, 'click', (e) => {
                map.setFitView();

                console.log("Pin clicked");
                self.pinAlert = self.alertCtrl.create({
                    title: 'Infomation',
                    subTitle: self.Pin.getExtData(),
                    buttons: ['OK']
                });
                self.pinAlert.present();
            });
            console.log("Pin firstly");
        }
        // this.pinWindow = new AMap.InfoWindow({
        //     autoMove: true,
        //     offset: new AMap.Pixel(0, -30),
        //     closeWhenClickMap: true
        // });
        return this.Pin;
    }


    /***
     * 自动补全关键词
     * @param keyword: 关键词
     * @returns {Observable}
     */
    public autoComplete(keyword: string): Observable<any> {
        return new Observable((sub: any) => {
            AMap.plugin(['AMap.Autocomplete'], () => {
                let autoOptions = {
                    city: localStorage.getItem('citycode') //城市，默认全国
                };
                let autocomplete = new AMap.Autocomplete(autoOptions);
                autocomplete.search(keyword, (status, result) => {
                    //note:这里用三个等号(===如果类型不同，其结果就是不等;高级类型，==和===是没有区别的,进行“指针地址”比较)
                    if ('complete' === status && 'OK' === result.info) {
                        sub.next(result.tips);
                        sub.complete();
                    } else if ("no_data" === status) {
                        sub.next("no_data");
                        sub.complete();
                    } else { //status为error
                        console.log(result);
                        sub.error(result);
                    }
                });
            });
        });
    }

    /***
     * 搜索指定地名
     * @param 地名
     * @returns {Observable}
     */
    //高德搜索出来的数据是很多的,不是唯一的
    public searchPlace(place: any): Observable<any> {
        console.log("searchPlace");
        return new Observable((sub: any) => {
            // note:也可以加载js的时候把插件顺带加载
            // 清除所有marker
            // AMap.clear();
            this.map.clearMap();

            AMap.service(["AMap.PlaceSearch"], () => {
                let placeSearch = new AMap.PlaceSearch({
                    map: this.map
                });  //构造地点查询类

                placeSearch.setCity(place.adcode);
                placeSearch.search(place.name, (status, result) => {
                    console.log("placeSearch success");
                    if ('complete' === status && 'OK' === result.info) {
                        this.placeSearchCallBack(result);
                        sub.next(result);
                        sub.complete();
                    } else if ("no_data" === status) {
                        sub.next("no_data");
                        sub.complete();
                    } else { //status为error
                        console.log("error");
                        console.log(result);
                        sub.error(result);
                    }
                });
            });
        });
    }

    /***
     * 搜索周边
     * @param type:类型
     * @param radius:半径
     * @returns {Observable}
     */
    public searchNearby(type: string, radius: number): Observable<any> {
        console.log("searchNearby" + type);
        return new Observable((sub: any) => {
            //清除所有marker
            // AMap.clear();
            this.map.clearMap();

            // 先获取当前坐标
            this.getGeolocationByAMap().subscribe(data => {
                console.log("getCurrentPosition success" + data);
                console.log(data);
                let lng = data.position.lng;
                let lat = data.position.lat;
                let cpoint = [lng, lat]; //中心点坐标
                console.log(cpoint);
                AMap.service(["AMap.PlaceSearch"], () => {
                    let placeSearch = new AMap.PlaceSearch({
                        pageSize: 10,
                        type: type,
                        pageIndex: 1,
                        city: localStorage.getItem('citycode')
                    });  //构造地点查询类

                    placeSearch.searchNearBy('', cpoint, radius, (status, result) => {
                        if ('complete' === status && 'OK' === result.info) {
                            this.nearbySearchCallBack(result);
                            sub.next(result);
                            sub.complete();
                        } else if ("no_data" === status) {
                            sub.next("no_data");
                            sub.complete();
                        } else { //status为error
                            console.log('searchNearby error');
                            console.log(result);
                            sub.error(result);
                        }
                    });
                });
            }, error => {
                console.log("getCurrentPosition error" + error);
                sub.error(error);
            });
        });
    }

    /***
     * 地名搜索回调函数
     * @param data
     */
    placeSearchCallBack(data) {
        console.log("placeSearchCallBack");
        let resultStr = "";
        let poiArr = data.poiList.pois;
        let resultCount = poiArr.length;
        for (let i = 0; i < resultCount; i++) {
            resultStr += "<div id='divid" + (i + 1) + "' onmouseover='openMarkerTipById1(" + i + ",this)' onmouseout='onmouseout_MarkerStyle(" + (i + 1) + ",this)' style=\"font-size: 12px;cursor:pointer;padding:0px 0 4px 2px; border-bottom:1px solid #C1FFC1;\"><table><tr><td><img src=\"http://webapi.amap.com/images/" + (i + 1) + ".png\"></td>" + "<td><h3><font color=\"#00a6ac\">名称: " + poiArr[i].name + "</font></h3>";
            resultStr += this.createContent(poiArr[i].type, poiArr[i].address, poiArr[i].tel) + "</td></tr></table></div>";
            this.addInfoWindow(i, poiArr[i]);
        }
        this.map.setFitView();
    }

    /***
     * 周边搜索回调函数
     * @param data
     */
    nearbySearchCallBack(data) {
        let resultStr = "";
        let poiArr = data.poiList.pois;
        let resultCount = poiArr.length;
        for (let i = 0; i < resultCount; i++) {
            resultStr += "<div id='divid" + (i + 1) + "' onmouseover='openMarkerTipById1(" + i + ",this)' onmouseout='onmouseout_MarkerStyle(" + (i + 1) + ",this)' style=\"font-size: 12px;cursor:pointer;padding:0px 0 4px 2px; border-bottom:1px solid #C1FFC1;\"><table><tr><td><img src=\"http://webapi.amap.com/images/" + (i + 1) + ".png\"></td>" + "<td><h3><font color=\"#00a6ac\">名称: " + poiArr[i].name + "</font></h3>";
            resultStr += this.createContent(poiArr[i].type, poiArr[i].address, poiArr[i].tel) + "</td></tr></table></div>";
            this.addInfoWindow(i, poiArr[i]);
        }
        this.map.setFitView();
    }

    /***
     * 添加marker
     */
    addMarker(i, d): any {
        let lngX = d[0];
        let latY = d[1];
        let markerOption = {
            map: this.map,
            //icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b" + (i + 1) + ".png",
            //content: '<div style="background-color: rgb(255, 255, 255); height: 20px; width: 20px; border: 1px solid rgb(255, 255, 255); border-radius: 12px; box-shadow: rgb(158, 158, 158) 0px 1px 4px; margin: 0px 0 0 0px;"></div><div style="background-color: rgb(82, 150, 243); height: 16px; width: 16px; border: 1px solid rgb(82, 150, 243); border-radius: 15px; box-shadow: rgb(158, 158, 158) 0px 0px 2px; margin: -18px 0 0 2px; "></div>',
            //offset: new AMap.Pixel(-15, -15),
            extData: '第' + i + '点',
            position: [lngX, latY],
            topWhenMouseOver: true
        };
        this.infoMarkers.push(new AMap.Marker(markerOption));
        return this.infoMarkers;
    }

    /***
     * 添加infowindow
     */
    addInfoWindow(i, d) {
        let mar = this.addMarker(i, d);
        let infoWindow = new AMap.InfoWindow({
            content: "<div style='font-size: 14px;'>  " + (i + 1) + ". " + d.name +
                " <a href=\"javascript:window.open('https://m.amap.com/detail/mapview/poiid=" + d.id +
                "', '_blank', 'location=no,closebuttoncaption=返回')\" style='text-decoration: underline; color: #4ba5ea; font-size: 12px;'>详情</a>" + "</div>" +
                this.createContent(d.type, d.address, d.tel),
            autoMove: true,
            offset: new AMap.Pixel(0, -30),
            closeWhenClickMap: true
        });
        this.windowsArr.push(infoWindow);

        AMap.event.addListener(mar, 'click', (e) => {
            infoWindow.open(this.map, mar.getPosition());
        });
    }

    /***
     * 添加AnvancedInfoWindow
     */
    addAnvancedInfoWindow(i, d) {
        console.log("addAnvancedInfoWindow");
        let mar = this.addMarker(i, d);
        let infoWindow;
        let content = "<div style='font-size: 14px;'>  " + (i + 1) + ". " + d.name +
            "<a style='color: #4ba5ea;font-size: 12px;'> 详情</a>" + "</div>" +
            this.createContent(d.type, d.address, d.tel);

        AMap.plugin('AMap.AdvancedInfoWindow', function () {
            infoWindow = new AMap.AdvancedInfoWindow({
                content: '<div class="info-title">高德地图</div><div class="info-content">' +
                    '<img src="http://webapi.amap.com/images/amap.jpg">' +
                    '高德是中国领先的数字地图内容、导航和位置服务解决方案提供商。<br/>' +
                    '<a target="_blank" href = "http://mobile.amap.com/">点击下载高德地图</a></div>',
                offset: new AMap.Pixel(0, -30)
            });
            infoWindow.open(this.map, [116.480983, 39.989628]);
        });

        AMap.event.addListener(mar, 'click', (e) => {
            infoWindow.open(this.map, [116.480983, 39.989628]);
        });
    }

    parseStr(p) {
        if (!p || p == "undefined" || p == " undefined" || p == "tel") {
            p = "暂无";
        }
        return p;
    }

    /***
     * 创建窗体内容dom
     */
    createContent(type, address, tel) {
        type = this.parseStr(type);
        address = this.parseStr(address);
        tel = this.parseStr(tel);
        let s = [];
        s.push("地址：" + address);
        s.push("电话：" + tel);
        return '<div style="font-size: 12px;">' + s.join("<br>") + '</div>';
    }
}
