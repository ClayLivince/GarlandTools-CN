gt.locale = {
    lang: 'chs',

    translate: function(obj) {
        if (!obj)
            return obj;

        var lang = gt.locale.lang;
        if (lang == 'en')
            return obj;

        if (typeof obj == 'string') {
            var value = gt.locale[lang][obj];
            return value ? value : obj;
        }

        if (Array.isArray(obj))
            return _.map(obj, function(v) { return gt.locale.translate(v); });

        return obj;
    },

    // Credits: Nenge (nenge.net)
    chs: {
       "Patches":"版本", "Hunt":"狩猎","Rotations":"采集循环", "Timers":"时间",

        // hunt data
        "Glimmerscale":"铜镜","Judgeray":"审判鳐","The Garlok":"伽洛克","Zona Seeker":"虚无探索者","Thousand-Cast Theda":"千竿口花希达","Croakadile":"咕尔呱洛斯","Mindflayer":"夺心魔","Laideronnette":"雷德罗巨蛇","Spawns after 10 Eorzean hours of rain (two cycles.)":"连续两个下雨天气期间10小时ET后溜达触发","Spawns after midnight on the second day of new moon.":"起始触发时间为新月凌晨时溜达触发.持续时间1-4日每天晚上.","Spawns on the first day of full moon after 5PM ET.":"起始触发时间为满月17时溜达触发.持续时间16-20日每天晚上.","Spawns after 200 real minutes of dry weather following showers or rain.":"雨后200分钟真实时间连续不下雨直至下一次下雨期间溜达触发.","Spawns upon catching a Glimmerscale at Nophica's Wells.":"在西萨纳兰丰饶神井渔场钓上铜镜.","Spawns upon catching a Judgeray at Fallgoard Float.":"在黑衣森林北部林区秋瓜湖畔渔场钓上审判鳐.","Unspoiled":'未知采集点',"Ephemeral":'限时采集地点',"Legendary":'传说的采集地点'," Gathering Rate 0%":"获得率 0%"," Gathering Fortune 0%":"获得率 0%",

        // zone data
        "Limsa Lominsa":"利姆萨・罗敏萨","Middle La Noscea":"中拉诺西亚","Lower La Noscea":"拉诺西亚低地","Eastern La Noscea":"东拉诺西亚","Western La Noscea":"西拉诺西亚","Upper La Noscea":"拉诺西亚高地","Outer La Noscea":"拉诺西亚外地","Mist":"海雾村","Gridania":"格里达尼亚","Central Shroud":"黑衣森林中央林区","East Shroud":"黑衣森林东部林区","South Shroud":"黑衣森林南部林区","North Shroud":"黑衣森林北部林区","The Lavender Beds":"薰衣草苗圃","Ul'dah":"乌尔达哈","Western Thanalan":"西萨纳兰","Central Thanalan":"中萨纳兰","Eastern Thanalan":"东萨纳兰","Southern Thanalan":"南萨纳兰","Northern Thanalan":"北萨纳兰","The Goblet":"高脚孤丘","Ishgard":"伊修加德","Coerthas Central Highlands":"库尔札斯中央高地","Coerthas Western Highlands":"库尔札斯西部高地","Mor Dhona":"摩杜纳","The Sea of Clouds":"阿巴拉提亚云海","Azys Lla":"魔大陆阿济兹拉","The Dravanian Forelands":"龙堡参天高地","The Dravanian Hinterlands":"龙堡内陆低地","The Churning Mists":"翻云雾海","Idyllshire":"田园郡",

        // weather data
        "Clear Skies":"碧空","Fair Skies":"晴朗","Clouds":"阴云","Fog":"薄雾","Wind":"微风","Gales":"强风","Rain":"小雨","Showers":"暴雨","Thunder":"打雷","Thunderstorms":"雷雨","Dust Storms":"扬沙","Sandstorms":"沙尘暴","Hot Spells":"炎热的天气","Heat Waves":"热浪","Snow":"小雪","Blizzards":"暴雪","Gloom":"妖雾","Auroras":"Auroras","Darkness":"黑暗","Tension":"绝命","Clouds":"阴云","Storm Clouds":"暴风雨云","Heat Waves":"热浪","Gloom":"妖雾","Gales":"强风","Fair Skies":"晴朗","Umbral Wind":"暗风","Umbral Static":"暗雾","Fair Skies":"晴朗",

        // other
        "Perception": "鉴别力", "Gathering": "获得力", "Gathering Rate": "获得率", "Gathering Fortune": "优质率", "Cooldown": "冷却", "hours": "小时", "maintenance": "维护",
        "Mining": "采矿工", "Botany": "园艺工", "Fishing": "捕鱼人", "Unspoiled": "未知的采集地点", "Ephemeral": "限时的采集地点", "Legendary": "传说的采集地点",
        "Collectable": "收集品", "Reducible": "精选", "Blue Scrips": "大地蓝票", "Red Scrips": "大地红票","White Scrips": "大地白票", "Yellow Scrips": "大地黄票",
        "Gold Saucer": "金碟游乐场", "The Hunt": "狩猎怪物",
        "Timeline": "采集时间轴", "Filters": "过滤", "Tasks": "只显示", "Other": "其他",
        "Classes": "显示职业", "Types": "显示类别",
        "Aetherial Reduction possible":"精选",
        "Timers": "采集列表", "timers": "个采集时间", 'hidden': '个隐藏', "Search": "搜索", "Maps": "地图",
        "Select a list for this timer": "将此时间表的物品保存到数据库列表中", "Create new list":"新建一个列表", "Name the new list":"给此列表命名",
        "Predator": "捕鱼人之识", "mooch":"以小钓大"
    }
}