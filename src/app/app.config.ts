export class AppConfig {
    private static map_localtion_city:string;
    private static map_point_selected_info:string;
    //获取设备高度
    public static getWindowHeight() {
        return window.screen.height;
    }
    //获取设备宽度
    public static getWindowWidth() {
        return window.screen.width;
    }

    public static getCity(temp:string): string {
        if(temp!=null)
            this.map_localtion_city = temp;

        return this.map_localtion_city;
    }

    public static getAppInfo(temp:string): string {
        if(temp!=null)
            this.map_point_selected_info = temp;

        return this.map_point_selected_info;
    }
}