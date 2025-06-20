﻿<?php

$weatherIndex = array("","碧空","晴朗","阴云","薄雾","微风","强风","小雨","暴雨","打雷","雷雨","扬沙","沙尘暴","高温","热浪","小雪","暴雪","妖雾","极光","黑暗","绝命","阴云","雷云","暴风雨","暴风雨","阴沉","热浪","妖雾","暴风","烟雾","晴朗","晴朗","晴朗","晴朗","晴朗","极光","辉核","辉核","辉核","辉核","滩云","滩云","滩云","滩云","神意","神意","神意","神意","神意","灵风","灵电","烟武","晴朗","兽雷","雷波","兽雷","神意","打雷","打雷","","神秘","神秘","小雨","晴朗","小雨","晴朗","邪天","邪天","晴朗","平衡","平衡","时光","时光","时光","鬼气","鬼气","鬼气","次元","次元","次元","豪雨","豪雨","极乐","极乐","龙威","龙威","豪雨","迅雷","打雷","次元","晴朗","碧空","白旋风","白旋风","白旋风","幻想","白旋风","月夜","月夜","月夜","月夜","红月下","朱炎","朱炎","朱炎","晴朗","晴朗","晴朗","晴朗","烈焰","海啸","龙卷风","地震","青空","青空","青空","乱灵流","青空","无尽光","暴风","末日","末日","妖梦","妖梦","妖梦","光天","光天","末日","末日","无尽光","烟雾","末日","晴朗","灵烈火","灵飘尘","灵飞电","灵罡风","流星雨","记忆乱流","阴云","阴云","极光","极光","雷云","火风暴","幻海流","","决战","月尘","磁暴","末日","星灵","星灵","星灵","星灵","星灵","虚拟","万魔殿","万魔殿","万魔殿","终极","绝望","神域","神域","神域","神域","神域","神域","神域","神域","邪天","虚无","虚无","虚无","次元","次元","次元","万魔殿","万魔殿","诗想","虚无","阈限","阈限","虚拟","虚拟","虚拟","虚拟","记忆","战云","虚拟","","","","魔尘","流星雨","流星雨","磁暴","孢子雾");

$zoneWeather = array('利姆萨·罗敏萨' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '利姆萨·罗敏萨上层甲板' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '利姆萨·罗敏萨下层甲板' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '中拉诺西亚' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 70, 'Weather' => 2), array('Rate' => 80, 'Weather' => 5), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '拉诺西亚低地' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 70, 'Weather' => 2), array('Rate' => 80, 'Weather' => 5), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '东拉诺西亚' => array(array('Rate' => 5, 'Weather' => 4), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 3), array('Rate' => 95, 'Weather' => 7), array('Rate' => 100, 'Weather' => 8)),
    '西拉诺西亚' => array(array('Rate' => 10, 'Weather' => 4), array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 80, 'Weather' => 3), array('Rate' => 90, 'Weather' => 5), array('Rate' => 100, 'Weather' => 6)),
    '拉诺西亚高地' => array(array('Rate' => 30, 'Weather' => 1), array('Rate' => 50, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 80, 'Weather' => 4), array('Rate' => 90, 'Weather' => 9), array('Rate' => 100, 'Weather' => 10)),
    '格里达尼亚' => array(array('Rate' => 5, 'Weather' => 7), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 55, 'Weather' => 2), array('Rate' => 85, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '乌尔达哈现世回廊' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '乌尔达哈来生回廊 - 来生回廊' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '西萨纳兰' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '中萨纳兰' => array(array('Rate' => 15, 'Weather' => 11), array('Rate' => 55, 'Weather' => 1), array('Rate' => 75, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '东萨纳兰' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 80, 'Weather' => 4), array('Rate' => 85, 'Weather' => 7), array('Rate' => 100, 'Weather' => 8)),
    '南萨纳兰' => array(array('Rate' => 20, 'Weather' => 14), array('Rate' => 60, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '北萨纳兰' => array(array('Rate' => 5, 'Weather' => 1), array('Rate' => 20, 'Weather' => 2), array('Rate' => 50, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '乌尔达哈' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '格里达尼亚新街' => array(array('Rate' => 5, 'Weather' => 7), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 55, 'Weather' => 2), array('Rate' => 85, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '格里达尼亚旧街' => array(array('Rate' => 5, 'Weather' => 7), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 55, 'Weather' => 2), array('Rate' => 85, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '黑衣森林中央林区' => array(array('Rate' => 5, 'Weather' => 9), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 55, 'Weather' => 2), array('Rate' => 85, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '黑衣森林东部林区' => array(array('Rate' => 5, 'Weather' => 9), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 55, 'Weather' => 2), array('Rate' => 85, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '黑衣森林南部林区' => array(array('Rate' => 5, 'Weather' => 4), array('Rate' => 10, 'Weather' => 10), array('Rate' => 25, 'Weather' => 9), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 70, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '黑衣森林北部林区' => array(array('Rate' => 5, 'Weather' => 4), array('Rate' => 10, 'Weather' => 8), array('Rate' => 25, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 70, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '伊修加德' => array(array('Rate' => 60, 'Weather' => 15), array('Rate' => 70, 'Weather' => 2), array('Rate' => 75, 'Weather' => 1), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '库尔札斯中央高地' => array(array('Rate' => 20, 'Weather' => 16), array('Rate' => 60, 'Weather' => 15), array('Rate' => 70, 'Weather' => 2), array('Rate' => 75, 'Weather' => 1), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '摩杜纳' => array(array('Rate' => 15, 'Weather' => 3), array('Rate' => 30, 'Weather' => 4), array('Rate' => 60, 'Weather' => 17), array('Rate' => 75, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '十二神大圣堂' => array(array('Rate' => 5, 'Weather' => 9), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 55, 'Weather' => 2), array('Rate' => 85, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '无限城市街古迹 - 腐坏的街道' => array(array('Rate' => 100, 'Weather' => 4)),
    '无限城古堡' => array(array('Rate' => 100, 'Weather' => 3)),
    '黑衣森林南部林区 - 兀尔德泉' => array(array('Rate' => 100, 'Weather' => 20)),
    '天狼星灯塔 - 地下1层' => array(array('Rate' => 100, 'Weather' => 3)),
    '南萨纳兰 - 赞拉克' => array(array('Rate' => 20, 'Weather' => 14), array('Rate' => 60, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '拉诺西亚外地' => array(array('Rate' => 30, 'Weather' => 1), array('Rate' => 50, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '提督室' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '炎帝陵' => array(array('Rate' => 100, 'Weather' => 26)),
    '狼狱停船场' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 10)),
    '奥·哥摩罗火口神殿' => array(array('Rate' => 100, 'Weather' => 29)),
    '荆棘之园' => array(array('Rate' => 100, 'Weather' => 27)),
    '呼啸眼石塔群' => array(array('Rate' => 100, 'Weather' => 28)),
    '石卫塔' => array(array('Rate' => 100, 'Weather' => 15)),
    '披雪大冰壁' => array(array('Rate' => 100, 'Weather' => 16)),
    '云廊' => array(array('Rate' => 100, 'Weather' => 3)),
    '密约之塔 - 低层' => array(array('Rate' => 100, 'Weather' => 17)),
    '海雾村' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 70, 'Weather' => 2), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '薰衣草苗圃' => array(array('Rate' => 5, 'Weather' => 3), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 55, 'Weather' => 2), array('Rate' => 85, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '高脚孤丘' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '呼啸眼外围' => array(array('Rate' => 100, 'Weather' => 28)),
    '后营门' => array(array('Rate' => 100, 'Weather' => 25)),
    '尘封秘岩' => array(array('Rate' => 15, 'Weather' => 4), array('Rate' => 40, 'Weather' => 7), array('Rate' => 100, 'Weather' => 2)),
    '黄金港城区' => array(array('Rate' => 10, 'Weather' => 7), array('Rate' => 20, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '水晶都' => array(array('Rate' => 20, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 75, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 95, 'Weather' => 7), array('Rate' => 100, 'Weather' => 10)),
    '游末邦' => array(array('Rate' => 10, 'Weather' => 6), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 45, 'Weather' => 3), array('Rate' => 85, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '乌尔达哈现世回廊 - 乌尔达哈飞艇坪' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '乌尔达哈来生回廊 - 政府层' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '利姆萨·罗敏萨上层甲板 - 利姆萨·罗敏萨飞艇坪' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '拘束舰外围 - 培养层' => array(array('Rate' => 100, 'Weather' => 3)),
    '对利维亚桑双体船' => array(array('Rate' => 100, 'Weather' => 23)),
    '神判古树' => array(array('Rate' => 100, 'Weather' => 22)),
    '无尽轮回剧场' => array(array('Rate' => 100, 'Weather' => 35)),
    '龙炎核心' => array(array('Rate' => 100, 'Weather' => 36)),
    '雪绒花商会' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '码头小屋' => array(array('Rate' => 5, 'Weather' => 4), array('Rate' => 50, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 90, 'Weather' => 3), array('Rate' => 95, 'Weather' => 7), array('Rate' => 100, 'Weather' => 8)),
    '云冠群岛' => array(array('Rate' => 30, 'Weather' => 2), array('Rate' => 60, 'Weather' => 4), array('Rate' => 90, 'Weather' => 5), array('Rate' => 100, 'Weather' => 49)),
    '塞尔法特尔溪谷' => array(array('Rate' => 100, 'Weather' => 4)),
    '巴埃萨长城 - 长城下部' => array(array('Rate' => 100, 'Weather' => 4)),
    '影之国 - 拉德莉亚女士号' => array(array('Rate' => 100, 'Weather' => 1)),
    '惨境号' => array(array('Rate' => 100, 'Weather' => 5)),
    '龙堡参天高地' => array(array('Rate' => 10, 'Weather' => 3), array('Rate' => 20, 'Weather' => 4), array('Rate' => 30, 'Weather' => 9), array('Rate' => 40, 'Weather' => 11), array('Rate' => 70, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '龙堡内陆低地' => array(array('Rate' => 10, 'Weather' => 3), array('Rate' => 20, 'Weather' => 4), array('Rate' => 30, 'Weather' => 7), array('Rate' => 40, 'Weather' => 8), array('Rate' => 70, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '翻云雾海' => array(array('Rate' => 10, 'Weather' => 3), array('Rate' => 20, 'Weather' => 6), array('Rate' => 40, 'Weather' => 50), array('Rate' => 70, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '龙巢神殿' => array(array('Rate' => 100, 'Weather' => 3)),
    '武神斗技场' => array(array('Rate' => 100, 'Weather' => 51)),
    '田园郡' => array(array('Rate' => 10, 'Weather' => 3), array('Rate' => 20, 'Weather' => 4), array('Rate' => 30, 'Weather' => 7), array('Rate' => 40, 'Weather' => 8), array('Rate' => 70, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '阿巴拉提亚云海' => array(array('Rate' => 30, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 80, 'Weather' => 4), array('Rate' => 90, 'Weather' => 5), array('Rate' => 100, 'Weather' => 49)),
    '魔大陆阿济兹拉' => array(array('Rate' => 35, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 100, 'Weather' => 9)),
    '无尽苍空' => array(array('Rate' => 100, 'Weather' => 3)),
    '奇点反应堆' => array(array('Rate' => 100, 'Weather' => 44)),
    '魔航船虚无方舟 - 上甲板' => array(array('Rate' => 100, 'Weather' => 9)),
    '库尔札斯西部高地' => array(array('Rate' => 20, 'Weather' => 16), array('Rate' => 60, 'Weather' => 15), array('Rate' => 70, 'Weather' => 2), array('Rate' => 75, 'Weather' => 1), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '暮卫塔' => array(array('Rate' => 100, 'Weather' => 16)),
    '抑制绝境S1T7' => array(array('Rate' => 100, 'Weather' => 60)),
    '抑制绝境P1T6' => array(array('Rate' => 100, 'Weather' => 69)),
    '抑制绝境Z1T9' => array(array('Rate' => 100, 'Weather' => 74)),
    '时空狭缝' => array(array('Rate' => 100, 'Weather' => 79)),
    '宝物殿' => array(array('Rate' => 100, 'Weather' => 80)),
    '妖歌海' => array(array('Rate' => 100, 'Weather' => 5)),
    '美神地下神殿' => array(array('Rate' => 100, 'Weather' => 82)),
    '伊修加德基础层' => array(array('Rate' => 60, 'Weather' => 15), array('Rate' => 70, 'Weather' => 2), array('Rate' => 75, 'Weather' => 1), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '伊修加德砥柱层' => array(array('Rate' => 60, 'Weather' => 15), array('Rate' => 70, 'Weather' => 2), array('Rate' => 75, 'Weather' => 1), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '白帝竹林' => array(array('Rate' => 100, 'Weather' => 92)),
    '德尔塔幻境1' => array(array('Rate' => 100, 'Weather' => 79)),
    '德尔塔幻境2' => array(array('Rate' => 100, 'Weather' => 79)),
    '德尔塔幻境3' => array(array('Rate' => 100, 'Weather' => 79)),
    '德尔塔幻境4' => array(array('Rate' => 100, 'Weather' => 79)),
    '神拳痕' => array(array('Rate' => 15, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 80, 'Weather' => 3), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 9)),
    '黄金港' => array(array('Rate' => 10, 'Weather' => 7), array('Rate' => 20, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '基拉巴尼亚边区' => array(array('Rate' => 15, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 80, 'Weather' => 3), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 9)),
    '基拉巴尼亚山区' => array(array('Rate' => 10, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 75, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 95, 'Weather' => 5), array('Rate' => 100, 'Weather' => 11)),
    '基拉巴尼亚湖区' => array(array('Rate' => 20, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 80, 'Weather' => 3), array('Rate' => 90, 'Weather' => 4), array('Rate' => 100, 'Weather' => 10)),
    '红玉海' => array(array('Rate' => 10, 'Weather' => 9), array('Rate' => 20, 'Weather' => 5), array('Rate' => 35, 'Weather' => 3), array('Rate' => 75, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '延夏' => array(array('Rate' => 5, 'Weather' => 8), array('Rate' => 15, 'Weather' => 7), array('Rate' => 25, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '太阳神草原' => array(array('Rate' => 5, 'Weather' => 6), array('Rate' => 10, 'Weather' => 5), array('Rate' => 17, 'Weather' => 7), array('Rate' => 25, 'Weather' => 4), array('Rate' => 35, 'Weather' => 3), array('Rate' => 75, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '白银乡' => array(array('Rate' => 10, 'Weather' => 7), array('Rate' => 20, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '优雷卡常风之地' => array(array('Rate' => 30, 'Weather' => 2), array('Rate' => 60, 'Weather' => 6), array('Rate' => 90, 'Weather' => 8), array('Rate' => 100, 'Weather' => 15)),
    '优雷卡恒冰之地' => array(array('Rate' => 10, 'Weather' => 2), array('Rate' => 28, 'Weather' => 4), array('Rate' => 46, 'Weather' => 14), array('Rate' => 64, 'Weather' => 15), array('Rate' => 82, 'Weather' => 9), array('Rate' => 100, 'Weather' => 16)),
    '优雷卡涌火之地' => array(array('Rate' => 10, 'Weather' => 2), array('Rate' => 28, 'Weather' => 14), array('Rate' => 46, 'Weather' => 9), array('Rate' => 64, 'Weather' => 16), array('Rate' => 82, 'Weather' => 49), array('Rate' => 100, 'Weather' => 15)),
    '优雷卡丰水之地' => array(array('Rate' => 12, 'Weather' => 2), array('Rate' => 34, 'Weather' => 8), array('Rate' => 56, 'Weather' => 17), array('Rate' => 78, 'Weather' => 10), array('Rate' => 100, 'Weather' => 15)),
    '阿拉米格王立飞空艇着陆场' => array(array('Rate' => 100, 'Weather' => 84)),
    '结晶化空间' => array(array('Rate' => 100, 'Weather' => 84)),
    '烈士庵' => array(array('Rate' => 5, 'Weather' => 8), array('Rate' => 15, 'Weather' => 7), array('Rate' => 25, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '多玛飞地' => array(array('Rate' => 5, 'Weather' => 8), array('Rate' => 15, 'Weather' => 7), array('Rate' => 25, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '望海楼' => array(array('Rate' => 10, 'Weather' => 7), array('Rate' => 20, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '水晶都' => array(array('Rate' => 20, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 75, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 95, 'Weather' => 7), array('Rate' => 100, 'Weather' => 10)),
    '游末邦 - 树根层' => array(array('Rate' => 10, 'Weather' => 6), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 45, 'Weather' => 3), array('Rate' => 85, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '雷克兰德' => array(array('Rate' => 20, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 75, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 95, 'Weather' => 7), array('Rate' => 100, 'Weather' => 10)),
    '珂露西亚岛' => array(array('Rate' => 10, 'Weather' => 6), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 4), array('Rate' => 45, 'Weather' => 3), array('Rate' => 85, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '安穆·艾兰' => array(array('Rate' => 45, 'Weather' => 2), array('Rate' => 60, 'Weather' => 3), array('Rate' => 70, 'Weather' => 11), array('Rate' => 80, 'Weather' => 14), array('Rate' => 100, 'Weather' => 1)),
    '伊尔美格' => array(array('Rate' => 10, 'Weather' => 7), array('Rate' => 20, 'Weather' => 4), array('Rate' => 35, 'Weather' => 3), array('Rate' => 45, 'Weather' => 10), array('Rate' => 60, 'Weather' => 1), array('Rate' => 100, 'Weather' => 2)),
    '拉凯提卡大森林' => array(array('Rate' => 10, 'Weather' => 4), array('Rate' => 20, 'Weather' => 7), array('Rate' => 30, 'Weather' => 49), array('Rate' => 45, 'Weather' => 1), array('Rate' => 85, 'Weather' => 2), array('Rate' => 100, 'Weather' => 3)),
    '黑风海' => array(array('Rate' => 20, 'Weather' => 3), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '完璧王座' => array(array('Rate' => 100, 'Weather' => 118)),
    '丽耶美格梦园' => array(array('Rate' => 100, 'Weather' => 4)),
    '天穹街' => array(array('Rate' => 60, 'Weather' => 15), array('Rate' => 70, 'Weather' => 2), array('Rate' => 75, 'Weather' => 1), array('Rate' => 90, 'Weather' => 3), array('Rate' => 100, 'Weather' => 4)),
    '南方博兹雅战线' => array(array('Rate' => 52, 'Weather' => 2), array('Rate' => 64, 'Weather' => 7), array('Rate' => 76, 'Weather' => 5), array('Rate' => 88, 'Weather' => 9), array('Rate' => 100, 'Weather' => 11)),
    '扎杜诺尔高原' => array(array('Rate' => 60, 'Weather' => 2), array('Rate' => 70, 'Weather' => 7), array('Rate' => 80, 'Weather' => 5), array('Rate' => 90, 'Weather' => 9), array('Rate' => 100, 'Weather' => 15)),
    '旧萨雷安' => array(array('Rate' => 10, 'Weather' => 1), array('Rate' => 50, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 100, 'Weather' => 15)),
    '拉札罕' => array(array('Rate' => 10, 'Weather' => 4), array('Rate' => 25, 'Weather' => 7), array('Rate' => 40, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 3)),
    '迷津' => array(array('Rate' => 15, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 100, 'Weather' => 7)),
    '萨维奈岛' => array(array('Rate' => 10, 'Weather' => 4), array('Rate' => 20, 'Weather' => 7), array('Rate' => 25, 'Weather' => 8), array('Rate' => 40, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 3)),
    '加雷马' => array(array('Rate' => 45, 'Weather' => 15), array('Rate' => 50, 'Weather' => 9), array('Rate' => 55, 'Weather' => 7), array('Rate' => 60, 'Weather' => 4), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '叹息海' => array(array('Rate' => 15, 'Weather' => 49), array('Rate' => 30, 'Weather' => 148), array('Rate' => 100, 'Weather' => 2)),
    '天外天垓' => array(array('Rate' => 15, 'Weather' => 149), array('Rate' => 85, 'Weather' => 2), array('Rate' => 100, 'Weather' => 49)),
    '厄尔庇斯' => array(array('Rate' => 25, 'Weather' => 3), array('Rate' => 40, 'Weather' => 49), array('Rate' => 85, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '正厅' => array(array('Rate' => 10, 'Weather' => 1), array('Rate' => 50, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 100, 'Weather' => 15)),
    '天际' => array(array('Rate' => 100, 'Weather' => 160)),
    '万魔殿正门' => array(array('Rate' => 100, 'Weather' => 157)),
    '所思大书院禁书库' => array(array('Rate' => 10, 'Weather' => 1), array('Rate' => 50, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 100, 'Weather' => 15)),
    '云使宫客房' => array(array('Rate' => 10, 'Weather' => 4), array('Rate' => 25, 'Weather' => 7), array('Rate' => 40, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 3)),
    '穹顶皓天' => array(array('Rate' => 5, 'Weather' => 15), array('Rate' => 25, 'Weather' => 2), array('Rate' => 65, 'Weather' => 1), array('Rate' => 80, 'Weather' => 3), array('Rate' => 90, 'Weather' => 4)),
    '生命奥秘研究层' => array(array('Rate' => 100, 'Weather' => 157)),
    '至福乐土' => array(array('Rate' => 15, 'Weather' => 149), array('Rate' => 85, 'Weather' => 2), array('Rate' => 100, 'Weather' => 49)),
    '冥魂石洞 - 白岭山麓' => array(array('Rate' => 100, 'Weather' => 16)),
    '万魔的产房' => array(array('Rate' => 100, 'Weather' => 157)),
    '埃斯蒂尼安的房间' => array(array('Rate' => 10, 'Weather' => 4), array('Rate' => 25, 'Weather' => 7), array('Rate' => 40, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 100, 'Weather' => 3)),
    '元老院站' => array(array('Rate' => 45, 'Weather' => 15), array('Rate' => 50, 'Weather' => 9), array('Rate' => 55, 'Weather' => 7), array('Rate' => 60, 'Weather' => 4), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 2), array('Rate' => 100, 'Weather' => 1)),
    '九号解决方案' => array(array('Rate' => 100, 'Weather' => 2)),
    '图莱尤拉' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '奥阔帕恰山' => array(array('Rate' => 20, 'Weather' => 1), array('Rate' => 50, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 80, 'Weather' => 4), array('Rate' => 90, 'Weather' => 5), array('Rate' => 100, 'Weather' => 15)),
    '克扎玛乌卡湿地' => array(array('Rate' => 25, 'Weather' => 1), array('Rate' => 60, 'Weather' => 2), array('Rate' => 75, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 95, 'Weather' => 7), array('Rate' => 100, 'Weather' => 8)),
    '亚克特尔树海' => array(array('Rate' => 15, 'Weather' => 1), array('Rate' => 55, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 85, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '夏劳尼荒野' => array(array('Rate' => 5, 'Weather' => 1), array('Rate' => 50, 'Weather' => 2), array('Rate' => 70, 'Weather' => 3), array('Rate' => 85, 'Weather' => 11), array('Rate' => 100, 'Weather' => 6)),
    '遗产之地' => array(array('Rate' => 5, 'Weather' => 2), array('Rate' => 25, 'Weather' => 3), array('Rate' => 40, 'Weather' => 4), array('Rate' => 45, 'Weather' => 7), array('Rate' => 50, 'Weather' => 10), array('Rate' => 100, 'Weather' => 50)),
    '活着的记忆' => array(array('Rate' => 10, 'Weather' => 7), array('Rate' => 20, 'Weather' => 4), array('Rate' => 40, 'Weather' => 3), array('Rate' => 100, 'Weather' => 2)),
    '金凰大堂' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '船头小屋' => array(array('Rate' => 40, 'Weather' => 1), array('Rate' => 80, 'Weather' => 2), array('Rate' => 85, 'Weather' => 3), array('Rate' => 95, 'Weather' => 4), array('Rate' => 100, 'Weather' => 7)),
    '地中天道秘密基地' => array(array('Rate' => 5, 'Weather' => 2), array('Rate' => 25, 'Weather' => 3), array('Rate' => 40, 'Weather' => 4), array('Rate' => 45, 'Weather' => 7), array('Rate' => 50, 'Weather' => 10), array('Rate' => 100, 'Weather' => 50)),
    '星芒市场' => array(array('Rate' => 100, 'Weather' => 15)),
    '次元黄道' => array(array('Rate' => 100, 'Weather' => 183)),
    '永护塔顶层' => array(array('Rate' => 100, 'Weather' => 181)),
    '玉韦亚瓦塔 - 瓦萨特恩亚泽托' => array(array('Rate' => 100, 'Weather' => 50)));

?>
