import type { Relationship, Group } from "../types";
import { peopleById } from "./people";

/**
 * 关系数据。每一条事实转化为一到多条边。
 * source → target 表示 relation 称谓成立的方向；reverseRelation 为反向称谓。
 * description 保留完整原始事实说明，避免丢失语义。
 */

let seq = 0;
function r(
  source: string,
  target: string,
  relation: string,
  reverseRelation: string,
  category: Relationship["category"],
  description: string,
  conf: Relationship["confidence"] = "confirmed",
): Relationship {
  seq += 1;
  return {
    id: `rel-${seq}`,
    source,
    target,
    relation,
    reverseRelation,
    category,
    description,
    confidence: conf,
  };
}

export const relationships: Relationship[] = [
  // ══════════ A. 胥偃 · 谢氏 · 黄氏 ══════════
  r("ousyangxiu", "xuyan", "岳父", "女婿", "family", "欧阳修的岳父是胥偃。"),
  r("xuyan", "lvyijian", "好友", "好友", "friend", "胥偃是吕夷简的好友。"),
  r("xuyan", "xiejingchu", "女婿", "岳父", "family", "胥偃有一个女婿叫谢景初。"),
  r("xiejiang", "xiejingchu", "父亲", "儿子", "family", "谢景初的父亲是谢绛。"),
  r("xiejiang", "ousyangxiu", "好友", "好友", "friend", "谢绛是欧阳修的好友。"),
  r("xiejiang", "meiyaochen", "妹夫", "妻子的兄长（大舅兄）", "friend", "谢绛的妹夫是梅尧臣（即梅尧臣娶了谢绛的妹妹）。"),
  r("xiejiang", "xiejingwen", "父亲", "儿子", "family", "谢绛第三子是谢景温。"),
  r("xiejingwen", "wangali", "女婿", "岳父", "family", "谢景温的女婿是王安礼。"),
  r("wangali", "wanganshi", "弟弟", "兄长", "family", "王安礼是王安石的弟弟。"),
  r("xiejingchu", "huangtingjian", "女婿", "岳父", "family", "谢景初的女婿是黄庭坚。"),
  r("huangtingjian", "huangmengsheng", "七叔祖", "侄孙", "family", "黄梦升是黄庭坚的七叔祖。"),
  r("ousyangxiu", "huangmengsheng", "幼年好友（随州）", "幼年好友（随州）", "friend", "欧阳修七八岁时在随州结识的好友，即黄梦升。"),
  r("ousyangxiu", "huangmengsheng", "同榜进士（天圣八年）", "同榜进士（天圣八年）", "exam", "欧阳修与黄梦升同为天圣八年进士。"),
  r("huangmengsheng", "huangmaozong", "弟弟", "兄长", "family", "黄茂宗是黄梦升的兄长。"),
  r("xuyan", "huangmaozong", "学生", "老师", "teacher", "黄茂宗的老师是胥偃。"),
  r("huangmaozong", "ousyangxiu", "引荐拜谒（胥偃）", "受其引荐", "recommendation", "黄茂宗曾引荐欧阳修拜谒胥偃。"),
  r("xuyan", "diaoyue", "妻兄（大舅兄）", "妹夫", "family", "刁约是胥偃的妻兄。"),
  r("ousyangxiu", "diaoyue", "同年好友", "同年好友", "exam", "刁约是欧阳修的同年好友。"),
  r("diaoyue", "sushi", "忘年交", "忘年交", "friend", "刁约与苏轼是忘年交。"),
  r("diaoyue", "meiyaochen", "妹夫", "妻子的兄长", "friend", "梅尧臣是刁约的妹夫（娶了刁约的妹妹）。"),

  // ══════════ B. 梅氏 · 苏氏 · 王氏 · 韩氏 · 吕氏 ══════════
  r("ousyangxiu", "wangchou", "同年好友", "同年好友", "exam", "王畴是欧阳修的同年好友。"),
  r("wangchou", "meidingchen", "女婿", "岳父", "family", "王畴的妻子是梅鼎臣的女儿。"),
  r("meiyaochen", "meidingchen", "堂兄", "堂弟", "family", "梅鼎臣是梅尧臣的堂兄。"),
  r("ousyangxiu", "sushunqin", "好友", "好友", "friend", "苏舜钦是欧阳修的好友。"),
  r("sushunqin", "sushunyuan", "弟弟", "兄长", "family", "苏舜钦的兄长是苏舜元。"),
  r("ousyangxiu", "sushunyuan", "好友", "好友", "friend", "苏舜元也是欧阳修好友。"),
  r("suqi", "sushunqin", "父亲", "儿子", "family", "苏舜钦的父亲是苏耆。"),
  r("suyijian", "suqi", "祖父", "孙子", "family", "苏耆的祖父是苏易简。"),
  r("suyijian", "wangyucheng", "师兄弟（同门）", "师兄弟（同门）", "friend", "苏易简与王禹偁为师兄弟（同门）。"),
  r("sushunqin", "wangdan", "外祖父", "外孙", "family", "苏舜钦的外祖父是王旦。"),
  r("wangdan", "wangsu", "父亲", "儿子", "family", "王旦的儿子是王素。"),
  r("ousyangxiu", "wangsu", "同年兼好友", "同年兼好友", "exam", "王素是欧阳修的同年兼好友。"),
  r("wangsu", "wanggong", "父亲", "儿子", "family", "王素的儿子是王巩。"),
  r("wanggong", "sushi", "好友", "好友", "friend", "王巩是苏轼的好友。"),
  r("wanggong", "zhangfangping", "女婿", "岳父", "family", "张方平是王巩的岳父。"),
  r("wangdan", "hanyi", "女婿", "岳父", "family", "王旦的长女嫁给韩亿。"),
  r("hanyi", "hanjiang", "父亲", "儿子", "family", "韩亿的儿子包括韩绛。"),
  r("hanyi", "hanwei", "父亲", "儿子", "family", "韩亿的儿子包括韩维。"),
  r("hanyi", "hanzhen", "父亲", "儿子", "family", "韩亿的儿子包括韩缜。"),
  r("ousyangxiu", "hanjiang", "好友", "好友", "friend", "韩绛是欧阳修好友。"),
  r("ousyangxiu", "hanwei", "好友", "好友", "friend", "韩维是欧阳修好友。"),
  r("ousyangxiu", "hanzhen", "好友", "好友", "friend", "韩缜是欧阳修好友。"),
  r("wangdan", "lvgongbi", "女婿", "岳父", "family", "王旦的四女嫁给吕公弼。"),
  r("lvyijian", "lvgongbi", "父亲", "儿子", "family", "吕公弼的父亲是吕夷简。"),
  r("lvgongbi", "lvgongzhu", "兄长", "弟弟", "family", "吕公著是吕公弼的弟弟。"),
  r("ousyangxiu", "lvgongzhu", "好友", "好友", "friend", "吕公著也是欧阳修好友。"),
  r("lvgongbi", "hanzhongyan", "女婿", "岳父", "family", "吕公弼的女儿嫁给韩忠彦。"),
  r("hanqi", "hanzhongyan", "父亲", "儿子", "family", "韩忠彦的父亲是韩琦。"),
  r("ousyangxiu", "hanqi", "好友", "好友", "friend", "韩琦是欧阳修好友。"),

  // ══════════ C. 胡宿 · 范仲淹 · 王洙 · 赵概 · 苏颂 ══════════
  r("husu", "huzongyu", "叔父/伯父", "侄子", "family", "胡宗愈是胡宿的侄子。"),
  r("husu", "hushuxiu", "祖父", "孙女", "family", "胡淑修是胡宿的孙女。"),
  r("lizhiyi", "hushuxiu", "丈夫", "妻子", "family", "胡淑修的丈夫是李之仪。"),
  r("sushi", "lizhiyi", "学生", "老师", "teacher", "李之仪的老师包括苏轼。"),
  r("fanchunren", "lizhiyi", "学生", "老师", "teacher", "李之仪的老师包括范纯仁。"),
  r("fanzhongyan", "fanchunren", "父亲", "儿子", "family", "范仲淹的儿子包括范纯仁。"),
  r("fanzhongyan", "fanchuncui", "父亲", "儿子", "family", "范仲淹的儿子包括范纯粹。"),
  r("fanchunren", "wangzhi", "女婿", "岳父", "family", "范纯仁娶了王质的女儿。"),
  r("fanchuncui", "wangzhi", "女婿", "岳父", "family", "范纯粹娶了王质的女儿。"),
  r("ousyangxiu", "zhangzai", "门生", "老师", "teacher", "张载是欧阳修的门生，号“横渠先生”。"),
  r("fanzhongyan", "zhangzai", "学生", "老师", "teacher", "张载也是范仲淹的学生。"),
  r("wangzhu", "wangqinchen", "父亲", "儿子", "family", "王洙的儿子是王钦臣。"),
  r("ousyangxiu", "wangqinchen", "赏识（谓其博学）", "受欧阳修赏识", "recommendation", "欧阳修非常喜欢王钦臣，认为其非常博学。"),
  r("wangqinchen", "wangyaochen", "堂兄", "堂弟", "family", "王尧臣是王钦臣的堂兄。"),
  r("ousyangxiu", "zhaogai", "好友", "好友", "friend", "赵概是欧阳修好友，天圣五年榜眼。"),
  r("ousyangxiu", "susong", "学生", "老师", "teacher", "苏颂是欧阳修的学生。"),
  r("sujing", "ouyangfa", "女婿", "岳父", "family", "苏颂之子苏京娶了欧阳修长子欧阳发的长女。"),
  r("songshou", "songminqiu", "父亲", "儿子", "family", "宋敏求的父亲是宋绶。"),

  // ══════════ D. 毕氏 · 欧阳棐 · 苏轼 · 范镇 · 吴氏 · 丁氏 ══════════
  r("ousyangxiu", "bizhongxun", "举荐", "受其举荐", "recommendation", "欧阳修曾举荐毕仲询。"),
  r("bizhongxun", "bizhongyou", "兄长", "弟弟", "family", "毕仲游是毕仲询的弟弟。"),
  r("bizhongyou", "ouyangfei", "好友", "好友", "friend", "毕仲游是欧阳修第三子欧阳棐的好友。"),
  r("ouyangfei", "sudai", "女婿", "岳父", "family", "欧阳棐的女儿嫁给苏轼的儿子苏迨。"),
  r("sudai", "ousyangxiu", "娶其孙女（孙女婿）", "孙女婿", "family", "苏迨的第二任妻子是欧阳修的孙女。"),
  r("sudai", "suzhai", "父亲", "儿子", "family", "苏迨与欧阳修孙女所生儿子，姓名疑似“苏箦”或相近字形，待复核。", "uncertain"),
  r("suzhai", "fanzhen", "曾孙女婿", "曾祖父", "family", "苏箦（姓名待复核）的妻子是范镇的曾孙女。", "uncertain"),
  r("ousyangxiu", "fanzhen", "好友", "好友", "friend", "范镇是欧阳修好友。"),
  r("ouyangfa", "wuchong", "女婿", "岳父", "family", "欧阳修长子欧阳发娶了吴充的女儿。"),
  r("wuchong", "wuyu", "兄长", "弟弟", "family", "吴育是吴充的兄长。"),
  r("ousyangxiu", "wuyu", "好友", "好友", "friend", "吴育是欧阳修好友。"),
  r("dingzongchen", "dingbaochen", "兄长", "弟弟", "family", "丁宝臣与兄长丁宗臣并称“二丁”，丁宗臣为兄长。"),
  r("ousyangxiu", "dingbaochen", "好友", "好友", "friend", "丁宝臣是欧阳修好友。"),

  // ══════════ E. 杨氏 · 二连 · 二宋 · 郑獬 · 叶清臣 ══════════
  r("yangcha", "yangzhi", "兄长", "弟弟", "family", "杨寘是杨察的弟弟。"),
  r("ousyangxiu", "lianshu", "好友", "好友", "friend", "欧阳修年少游历时认识连庶，二人有交往。"),
  r("ousyangxiu", "lianxiang", "好友", "好友", "friend", "欧阳修年少游历时认识连庠，二人有交往。"),
  r("lianshunbin", "lianshu", "父亲", "儿子", "family", "连舜宾是连庶的父亲。"),
  r("lianshunbin", "lianxiang", "父亲", "儿子", "family", "连舜宾是连庠的父亲。"),
  r("songxiang", "lianshunbin", "曾拜见（长辈）", "受其接见（晚辈）", "other", "宋庠拜见过连舜宾（连庶、连庠之父）。"),
  r("songqi", "lianshunbin", "曾拜见（长辈）", "受其接见（晚辈）", "other", "宋祁拜见过连舜宾（连庶、连庠之父）。"),
  r("ousyangxiu", "lianshunbin", "曾拜见（长辈）", "受其接见（晚辈）", "other", "欧阳修拜见过连舜宾（连庶、连庠之父）。"),
  r("ousyangxiu", "songxiang", "好友", "好友", "friend", "宋庠是欧阳修好友。"),
  r("ousyangxiu", "songqi", "好友", "好友", "friend", "宋祁是欧阳修好友。"),
  r("yanshu", "songxiang", "学生", "老师", "teacher", "宋庠的老师是晏殊。"),
  r("yanshu", "songqi", "学生", "老师", "teacher", "宋祁的老师是晏殊。"),
  r("zhengxie", "fanzhongyan", "连襟", "连襟", "friend", "郑獬与范仲淹是连襟。"),
  r("yeqingchen", "yemengde", "家族先祖", "家族后代", "family", "叶梦得是叶清臣家族的后代。"),

  // ══════════ F. 江休复 · 余靖 · 二尹 · 祖无择 · 孙复 · 胡瑗 ══════════
  r("ousyangxiu", "jiangxiufu", "好友", "好友", "friend", "江休复是欧阳修好友，天圣二年进士，《邻几杂志》作者。"),
  r("ousyangxiu", "yujing", "好友", "好友", "friend", "余靖是欧阳修好友，天圣二年进士。"),
  r("ousyangxiu", "yinzhu", "好友", "好友", "friend", "尹洙是欧阳修好友，天圣二年进士。"),
  r("yinzhu", "yujing", "同年应制科", "同年应制科", "exam", "尹洙与余靖同一年参加制科。"),
  r("yinzhu", "fubi", "同年应制科", "同年应制科", "exam", "尹洙与富弼同一年参加制科。"),
  r("yinzhu", "zhangfangping", "同年应制科", "同年应制科", "exam", "尹洙与张方平同一年参加制科。"),
  r("muxiu", "yinzhu", "学生", "老师", "teacher", "尹洙的老师是穆修。"),
  r("muxiu", "sushunqin", "学生", "老师", "teacher", "苏舜钦也是穆修的学生。"),
  r("yinyuan", "yintun", "祖父", "孙子", "family", "尹焞是尹源的孙子。"),
  r("chenghao", "yintun", "大弟子（门生）", "老师", "teacher", "尹焞是程颢（二程之一）的大弟子。"),
  r("chengyi", "yintun", "大弟子（门生）", "老师", "teacher", "尹焞是程颐（二程之一）的大弟子。"),
  r("ousyangxiu", "chenghao", "门生", "老师", "teacher", "程颢（二程）是欧阳修门生。"),
  r("ousyangxiu", "chengyi", "门生", "老师", "teacher", "程颐（二程）是欧阳修门生。"),
  r("ousyangxiu", "zuwuze", "好友", "好友", "friend", "祖无择是欧阳修好友。"),
  r("sunfu", "zuwuze", "学生", "老师", "teacher", "祖无择的老师是孙复（号“泰山先生”）。"),
  r("lidi", "sunfu", "大舅兄（妻子的哥哥）", "妹夫", "friend", "孙复是李迪的妹夫（娶了李迪之妹）。"),
  r("sunfu", "shijie", "学生", "老师", "teacher", "石介是孙复的学生，号“徂徕先生”。"),
  r("ousyangxiu", "shijie", "同年兼好友", "同年兼好友", "exam", "石介是欧阳修同年兼好友。"),
  r("huyuan", "ouyangfa", "学生", "老师", "teacher", "欧阳修长子欧阳发的老师是胡瑗（号“安定先生”）。"),
  r("huyuan", "sunjue", "学生", "老师", "teacher", "孙觉是胡瑗的学生。"),
  r("sunjue", "huangtingjian", "女婿", "岳父", "family", "孙觉是黄庭坚的岳父。"),
  r("sunjue", "sushi", "好友", "好友", "friend", "孙觉是苏轼好友。"),
  r("sunjue", "ousyangxiu", "请教文章（受教）", "指点文章", "other", "孙觉曾向欧阳修请教文章写法。"),

  // ══════════ G. 蔡襄 · 王曙 · 晁氏家族 ══════════
  r("ousyangxiu", "caixiang", "同年好友", "同年好友", "exam", "蔡襄是欧阳修同年好友，为“宋四家”之一。"),
  r("caixiang", "caiyan", "父亲", "儿子", "family", "蔡襄的儿子是蔡晏。"),
  r("caiyan", "fanchengda", "外祖父", "外孙", "family", "范成大是蔡晏的外孙。"),
  r("caixiang", "wenyangbo", "女婿", "岳父", "family", "文彦博是蔡襄的岳父。"),
  r("ousyangxiu", "wangshu", "上司", "下属", "politics", "欧阳修的上司是王曙。"),
  r("wangshu", "kouzhun", "女婿", "岳父", "family", "王曙的岳父是寇准。"),
  r("wangshu", "wangyirou", "父亲", "儿子", "family", "王益柔是王曙的儿子。"),
  r("ousyangxiu", "wangyirou", "好友", "好友", "friend", "王益柔是欧阳修好友，曾因进奏院事件创作《傲歌》。"),
  r("ousyangxiu", "chaoduanyan", "学生", "老师", "teacher", "晁端彦是欧阳修的学生。"),
  r("chaoduanyan", "chaoshuozhi", "父亲", "儿子", "family", "晁端彦的儿子包括晁说之。"),
  r("chaoduanyan", "chaoyongzhi", "父亲", "儿子", "family", "晁端彦的儿子包括晁咏之。"),
  r("chaoduanyan", "chaobuzhi", "叔父（侄儿）", "伯父", "family", "晁补之是晁端彦的侄子。"),
  r("sushi", "chaoshuozhi", "门生", "老师", "teacher", "晁说之是苏轼门下。"),
  r("sushi", "chaoyongzhi", "门生", "老师", "teacher", "晁咏之是苏轼门下。"),
  r("sushi", "chaobuzhi", "门生", "老师", "teacher", "晁补之是苏轼门下。"),
  r("chaoduanyan", "zhangdun", "并称“三同”（关系待考）", "并称“三同”（关系待考）", "group", "原资料称晁端彦与章惇为“三同”，具体含义待补充解释、待复核，本图不擅自推断完整成员。", "uncertain"),
  r("chaoshuozhi", "zhubian", "相识", "相识", "friend", "晁说之认识《曲洧旧闻》作者朱弁。"),
  r("chaozongque", "chaoduanyan", "祖父", "孙子", "family", "晁端彦的祖父是晁宗悫。"),

  // ══════════ H. 曾巩 · 曾布 · 魏泰 · 王安国 ══════════
  r("ousyangxiu", "cenggong", "学生", "老师", "teacher", "曾巩是欧阳修的学生。"),
  r("cenggong", "chaoduanyan", "姻亲（娶晁氏，为晁端彦辈分之姑）", "姻亲", "family", "曾巩的妻子是晁氏，该晁氏是晁端彦辈分上的姑姑。"),
  r("cenggong", "cengbu", "兄长", "弟弟", "family", "曾巩的弟弟是曾布。"),
  r("cengbu", "weiwan", "丈夫", "妻子", "family", "曾布的妻子是魏玩。"),
  r("weiwan", "weitai", "姐姐", "弟弟", "family", "魏泰是魏玩的弟弟。"),
  r("weitai", "ouyangfei", "涉案被审（强占民田）", "审案（涉案人）", "other", "魏泰曾因强占民田被告到欧阳棐处。"),
  r("ouyangfei", "weitai", "惩治", "受惩治", "politics", "欧阳棐惩治魏泰。"),
  r("weitai", "cengbu", "告状（诉冤）", "受理诉状", "other", "魏泰随后向曾布告状。"),
  r("wanganguo", "cenggong", "娶其妹（姻亲）", "妻子的兄长", "family", "曾巩的妹妹嫁给王安石的弟弟王安国。"),

  // ══════════ I. 张先 · 王莘 · 唐介 · 王拱辰 · 王琪 · 李格非 · 李清照 ══════════
  r("ousyangxiu", "zhangxian", "同年", "同年", "exam", "张先是欧阳修的同年。"),
  r("zhangxian", "sushi", "忘年交", "忘年交", "friend", "张先与苏轼是忘年交。"),
  r("ousyangxiu", "wangshen", "学生", "老师", "teacher", "王莘是欧阳修的学生。"),
  r("wangshen", "wangzhizhi", "父亲", "儿子", "family", "王铚是王莘的儿子，《默记》作者。"),
  r("wangzhizhi", "cengbu", "曾孙女婿（娶其孙女）", "孙女婿", "family", "王铚娶了曾布的孙女。"),
  r("ousyangxiu", "tangjie", "同年好友", "同年好友", "exam", "唐介是欧阳修的同年好友。"),
  r("tangjie", "luyou", "外曾祖父（孙女为陆游之母）", "外曾孙", "family", "唐介的孙女是陆游的母亲（唐介为陆游外曾祖父）。"),
  r("ousyangxiu", "wanggongchen", "同年好友", "同年好友", "exam", "王拱辰是欧阳修的同年好友。"),
  r("ousyangxiu", "wanggongchen", "连襟", "连襟", "family", "王拱辰也是欧阳修的连襟。"),
  r("ligefei", "wanggongchen", "孙女婿（娶其孙女）", "祖父", "family", "王拱辰的孙女嫁给李格非。"),
  r("ousyangxiu", "wangqi", "好友", "好友", "friend", "王琪是欧阳修好友。"),
  r("wangqi", "wanggui", "兄长", "弟弟", "family", "王珪是王琪的弟弟。"),
  r("ousyangxiu", "wanggui", "学生", "老师", "teacher", "王珪是欧阳修学生。"),
  r("ligefei", "wanggui", "女婿（娶其女）", "岳父", "family", "王珪的女儿嫁给李格非。"),
  r("wanggui", "liqingzhao", "外祖父", "外孙女", "family", "李清照是王珪的外孙女。"),
  r("chaobuzhi", "liqingzhao", "问学（受学）", "向其问学", "teacher", "李清照曾问学于晁补之。"),
  r("sushi", "ligefei", "学生", "老师", "teacher", "李格非是苏轼学生。"),

  // ══════════ J. 李清臣 · 杨畋 · 欧阳守道 · 文天祥 ══════════
  r("ousyangxiu", "liqingchen", "学生", "老师", "teacher", "李清臣是欧阳修的学生。"),
  r("ousyangxiu", "liqingchen", "赏识（谓其才华可比苏轼）", "受欧阳修赏识", "recommendation", "欧阳修认为李清臣的才华可以和苏轼相比。"),
  r("liqingchen", "hanqi", "侄女婿（娶其侄女）", "伯叔辈姻亲", "family", "李清臣的妻子是韩琦的侄女。"),
  r("yangtian", "suzhe", "举荐应制科（并任考官）", "受其举荐应制科", "recommendation", "欧阳修好友杨畋曾举荐苏辙参加制科，杨畋也是当年的制科考官。"),
  r("ousyangxiu", "ouyangshoudao", "家族先祖", "家族后代", "family", "南宋欧阳守道是欧阳修家族后代。"),
  r("ousyangxiu", "yangtian", "好友", "好友", "friend", "杨畋是欧阳修好友。"),
  r("ouyangshoudao", "wentianxiang", "学生", "老师", "teacher", "文天祥是欧阳守道的学生。"),
  r("ouyangshoudao", "wentianxiang", "女婿", "岳父", "family", "文天祥也是欧阳守道的女婿。"),
];

// ══════════ 并称 / 团体 / 称号（不作为人物） ══════════

export const groups: Group[] = [
  { id: "g2su", name: "二苏", members: ["sushunqin", "sushunyuan"], description: "苏舜钦、苏舜元并称。", },
  { id: "g3su", name: "铜山三苏", members: ["suyijian", "sushunyuan", "sushunqin"], description: "苏易简、苏舜元、苏舜钦并称。", },
  { id: "gxining", name: "熙宁三舍人", members: ["songminqiu", "susong", "lidarong"], description: "宋敏求、苏颂、李大临并称。", },
  { id: "g2ding", name: "二丁", members: ["dingzongchen", "dingbaochen"], description: "丁宗臣、丁宝臣兄弟并称。", },
  { id: "g2lian", name: "二连", members: ["lianshu", "lianxiang"], description: "连庶、连庠兄弟并称。", },
  { id: "g4xian", name: "应山四贤", members: ["songxiang", "songqi", "lianshu", "lianxiang"], description: "宋庠、宋祁与连庶、连庠并称。", },
  { id: "g2song", name: "二宋", members: ["songxiang", "songqi"], description: "宋庠、宋祁并称。", },
  { id: "g4yu", name: "天圣四友", members: ["zhengxie", "yeqingchen", "songxiang", "songqi"], description: "郑獬、叶清臣、宋庠、宋祁并称。", },
  { id: "g2yin", name: "二尹", members: ["yinzhu", "yinyuan"], description: "尹洙、尹源并称。", },
  { id: "g3xiansheng", name: "宋初三先生", members: ["huyuan", "shijie", "sunfu"], description: "胡瑗、石介、孙复并称。", },
  { id: "g2cheng", name: "二程", members: ["chenghao", "chengyi"], description: "程颢、程颐兄弟并称。资料指“二程”为欧阳修门生。", },
];

// 为部分人物补充科举/作品称号标签（不作为节点，仅作人物标签展示）
export const personTags: Record<string, string[]> = {
  husu: ["天圣二年进士"],
  yujing: ["天圣二年进士"],
  jiangxiufu: ["天圣二年进士"],
  yinzhu: ["天圣二年进士"],
  wangyaochen: ["天圣五年状元"],
  zhaogai: ["天圣五年榜眼"],
  yangzhi: ["庆历二年状元"],
  songxiang: ["天圣二年状元"],
  yeqingchen: ["天圣二年榜眼"],
  zhengxie: ["天圣二年探花"],
  huangmengsheng: ["天圣八年进士"],
  ousyangxiu: ["天圣八年进士"],
  wangyirou: ["《傲歌》作者"],
  wangzhizhi: ["《默记》作者"],
};

function thisPersonName(id: string): string {
  return peopleById[id]?.name ?? id;
}

/**
 * 由“并称”生成的组内成员连线（属于 group 类别）：
 * 使“熙宁三舍人”等并称成员之间产生“并列并称”的关系，从而可参与路径搜索。
 * 这类连线不作为原始史料，仅作为“并称”这一组团关系的呈现。
 */
export const groupRelationships: Relationship[] = (() => {
  const out: Relationship[] = [];
  groups.forEach((g, gi) => {
    const members = g.members;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        out.push({
          id: `grp-${g.id}-${i}-${j}`,
          source: members[i],
          target: members[j],
          relation: `同列“${g.name}”`,
          reverseRelation: `同列“${g.name}”`,
          category: "group",
          description:
            `“${g.name}”把 ${g.members
              .map((m) => thisPersonName(m))
              .join("、")} 并称。` + (g.description ? `（${g.description}）` : ""),
        });
      }
    }
  });
  return out;
})();
