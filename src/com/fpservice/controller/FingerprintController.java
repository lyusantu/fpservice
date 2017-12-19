package com.fpservice.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import zk.jni.JavaToBiokey;

import com.fpservice.service.FingerprintService;
import com.jfinal.core.Controller;
import com.jfinal.kit.Prop;
import com.jfinal.kit.PropKit;
import com.jfinal.plugin.activerecord.Db;
import com.jfinal.plugin.activerecord.Record;

public class FingerprintController extends Controller {

	static FingerprintService fpService = new FingerprintService();

	public void index() {
		render("/index.html");
	}

	public void login() {
		getResponse().addHeader("Access-Control-Allow-Origin", "*");
		getResponse().addHeader("Access-Control-Allow-Methods", "POST, GET");
		getResponse().setContentType("text/html;charset=utf-8");
		String fingerprint = getPara("fingerprint");
		String sid = getPara("sid");
		PropKit.use("db_config.txt");
		String table = PropKit.get("table");
		String finger = PropKit.get("finger"); 
		String sid_key = PropKit.get("sid");
		String id_key = PropKit.get("id");
		String uid_key = PropKit.get("uid");
		String loginTime_key = PropKit.get("loginTime");
		Map<String, Object> map = new HashMap<String, Object>();
		if (fingerprint == null || fingerprint.length() <= 0) {
			map.put("flag", 0);
			map.put("msg", "参数为空");
		} else {
			boolean flag = false;
			List<Record> fps = fpService.listFingerprints(table, id_key,uid_key, finger, sid, sid_key);
			if(fps != null && fps.size() > 0){
				for (Record fp : fps) {
					flag = JavaToBiokey.NativeToProcess(fingerprint,
							fp.getStr(finger));
					if (flag) {
						String returnVal = PropKit.get("return"); // return val
						Integer id = fp.getInt(returnVal);
						map.put("msg", "returnType：" + returnVal +",returnValue：" + id);
						map.put("id", id);
						int loginTime = (int) (System.currentTimeMillis() / 1000L);
						fpService.updateLoginInfo(table, loginTime_key, loginTime, id_key, id);
						break;
					}
				}
			}
			map.put("flag", (flag ? 1 : 0));
		}
		renderJson(map);
	}

	public void register() {
		getResponse().addHeader("Access-Control-Allow-Origin", "*");
		getResponse().addHeader("Access-Control-Allow-Methods", "POST, GET");
		getResponse().setContentType("text/html;charset=utf-8");
		String fingerprint = getPara("fingerprint");
		int fingerNum = getParaToInt("fingerNum");
		int userId = getParaToInt("uid");
		String sid = getPara("sid");
		PropKit.use("db_config.txt");
		String table = PropKit.get("table");
		String finger = PropKit.get("finger");
		String id = PropKit.get("id");
		String u_fingerNum = PropKit.get("fingerNum");
		String createTime = PropKit.get("createTime");
		String sid_key = PropKit.get("sid");
		String uid = PropKit.get("uid");
		String flag_key = PropKit.get("flag");
		Map<String, Object> map = new HashMap<String, Object>();
		if (fingerprint == null || fingerNum == -1) {
			map.put("flag", 0);
		} else {
			boolean flag = false;
			List<Record> fps = fpService.listFingerprints(table, id, uid, finger, sid, sid_key);
			if(fps != null && fps.size() > 0){
				for (Record rs : fps) {
					flag = JavaToBiokey.NativeToProcess(fingerprint,rs.getStr(finger));
					if (flag) {
						map.put("flag", 2);
						break;
					}
				}
			}
			if (!flag) {
				Record record = new Record();
				record.set(finger, fingerprint);
				record.set(u_fingerNum, fingerNum);
				record.set(createTime,(System.currentTimeMillis() / 1000L));
				record.set(uid, userId);
				record.set(flag_key, 0);
				if(sid != null && !"".equals(sid) && sid_key != null && !"".equals(sid_key))
					record.set(sid_key, sid);
				map.put("flag", (fpService.addFp(record, table) ? 1 : 0)); // 添加指纹
			}
		}
		renderJson(map);
	}

	public void getUserFingers(){
		getResponse().addHeader("Access-Control-Allow-Origin", "*");
		getResponse().addHeader("Access-Control-Allow-Methods", "POST, GET");
		getResponse().setContentType("text/html;charset=utf-8");
		int uid = getParaToInt("uid");
		String sid = getPara("sid");
		PropKit.use("db_config.txt");
		String table = PropKit.get("table");
		String u_fingerNum = PropKit.get("fingerNum");
		String uid_key = PropKit.get("uid");
		String flag_key = PropKit.get("flag");
		String sid_key = PropKit.get("sid");
		List<Record> fingers = fpService.getUserFingers(table, uid, sid, uid_key, u_fingerNum,flag_key, sid_key);
		List<Integer> finger = new ArrayList<Integer>();
		if(fingers != null && fingers.size() > 0){
			for (Record record : fingers) {
				int fingerNum = record.getInt("finger_num");
				finger.add(fingerNum);
			}
		}
		renderJson("fingers",finger);
	}
	
	public void delUserFinger(){
		getResponse().addHeader("Access-Control-Allow-Origin", "*");
		getResponse().addHeader("Access-Control-Allow-Methods", "POST, GET");
		getResponse().setContentType("text/html;charset=utf-8");
		int uid = getParaToInt("uid");
		int fingerNum = getParaToInt("fingerNum");
		PropKit.use("db_config.txt");
		String table = PropKit.get("table");
		String fingerNum_key = PropKit.get("fingerNum");
		String uid_key = PropKit.get("uid");
		String flag_ley = PropKit.get("flag");
		boolean flag = fpService.delUserFinger(table, uid_key,uid, fingerNum_key,fingerNum,flag_ley,-1);
		renderJson("flag",flag ? 1 : 0);
	}
	
	public void commitUserFingers(){
		getResponse().addHeader("Access-Control-Allow-Origin", "*");
		getResponse().addHeader("Access-Control-Allow-Methods", "POST, GET");
		getResponse().setContentType("text/html;charset=utf-8");
		int uid = getParaToInt("uid");
		PropKit.use("db_config.txt");
		String table = PropKit.get("table");
		String uid_key = PropKit.get("uid");
		String flag_key = PropKit.get("flag");
		fpService.commitUserFingers(table, uid_key, uid, flag_key);
		renderJson("flag", 1);
	}
	
	public void rollBackUserFingers(){
		getResponse().addHeader("Access-Control-Allow-Origin", "*");
		getResponse().addHeader("Access-Control-Allow-Methods", "POST, GET");
		getResponse().setContentType("text/html;charset=utf-8");
		int uid = getParaToInt("uid");
		PropKit.use("db_config.txt");
		String table = PropKit.get("table");
		String uid_key = PropKit.get("uid");
		String flag_key = PropKit.get("flag");
		fpService.rollBackUserFingers(table, uid_key, uid, flag_key);
		renderJson("flag", 1);
	}
	
	public void check() {
		String finger = getPara("finger");
		String s1 = "TA1TUzIxAAAFTkwECAUHCc7QAAAWT3YBAAAAhfM0lE7HABELpwAgAEVHvQCuABMPcwDyTkQNzADyAPgP5E67ACEN2QA/AD5A7QDaAKEPnAAJT9MMPgDwAIwNck4sAXIPSADcAdBFVQArAe0OOQBxTo8HMgAwAScN4E43AIULLwCJAf1CRwAaAOYPZgC/ThcPegDcACgKwE6+AB4NjwA6AFtBbQD1ANYNugCCTu8P5gDjAO4N6k60ABwPPgAUAFFB0wB1AAkPMQANTz8O/QAIAf4P4U5oAA0P8QD4AcNBngA0APkPkQA3TmsPlgAbADQPi07fAF0LhgBsAPBBoACbAAMPCgDSTi4NpQCEADkPak4EAdoN4gAwADBBrAB0AHIPqAAlT+cN6AANAXMOlk5dAPUMuQD6AV1BPQAfAc0MjQBFT/cPGgBkAKMOBk9NAcwOLwD9AOxBWP61tiIcoP7IqaPlmfXd/88QNETgBkINWQSMCry0UATZB5KB9QvYTmiGOHstb6B3ELOg+tHv+vSfems5tIyShcqa3QuUS9TqPRrp+uwjgM1zh6cLdRV87+ChPnlLfy/7sAdIVVYsxX/2/lr30EhYByoUmZEsG3OSEA2V813/W4TnTgMh5fyB688Ez7eT9qruLI9k+eyx2Pyqfd4DqwxOzTZrYf76mb9/RUi1i+ULxP54hudG3AaFgzeJHP5yXn6JOQvWBwaLxMmTgQt7wfsW/wbFqHHpTjEfv/S7qqPhRQrqEHvsYEkAE5X3WY0I+gdcYAQZCun3ff8QQ9D6YXmufddpxDpcDwn7vHsEfnQwq4Va/7r77paypQqnoPsJ7QzjZEQkF/kD73w6//bNUApzk2cbV4F3SOqE/9qf3z+3wm5RAQK5IpXBAGZOaHsFAHQArME8RwGMAHTEwINrDU6mAHF8/8E6BAVzAGR+CABQxGnHKnMXAPIGibnCxI93/3BYwMI7XQxO/xaQwsCJtgYFDx5kc8AYAcYlls3C/sLBwXCZWMQEwAcAUzFwB/7GBwcA5jOMkAQGBRs3YlHAGgHLNpWOwHzC/8RrocFhFmYHAOQ5gAXAxysFAOw5CVXfAQoejWd7jMJFBcHFFWtwDQB7VKzBYSpkwgoAl1k1/j0J/gMAG2dcBQQFqWkJQBcA36yDb87AZMFkwMG1bx5PEWqPwcDCBP99wsHAwHvAwLHBh0oBq3J3jQbF1XZIVP0EAKx4tWwDTtR4D8IvCcWnhLorwMBDCgBlh3GMa2fCCQCoQv36sME4wA8Ae05pxCpxwMJm/wrFpJyz/jVU/wYAYZ8GscEzCwCBrKPAjozDWwcAiawywPmxVgUAv7IQOioBTvOzFjUUAdeznzWCwJZ2wnEHBQW/uB5GBACmfwknSAHluhz/S8wAm/V7w43Bw/zKAMTylsSCwsKGB8DFsgUAyb4XNs0A5/AjRTAFAKZ6FilKAcfDIMDAygCWiwEb/v1L/+zAAE6Sywz8JAnFOtcUccL+wf8JxT/QHcBm/lQEALrc7FoLAIvdZMM6w/4VwQoAk94iMsD5sf78PwYA8BskO4wFAI7iUzbNAJCqTsD7WP8Dxerhav8PAKrnNzgxNY78wP3AwQPF5uJjwQsApelD9jX6ZAcAO/JQwvkEBQ/yRlkJAMsxQFEN/AkAz/Q6/cAzRQG0+kZBM/0FFRZbgMBZCQB8+jiwOjUIANj9hVf6dgkA3P03QfsEFcMDVyYIEPzMN/qw/ME2BxECzDT7sTMEEPEKPYEEFbgLOjAGEOnWOvthBBEMFzcjwBBKYWhRBBB1L7RMAF5WZoD/wf8=";
		String s2 = "TdFTUzIxAAAEkpUECAUHCc7QAAAXk3YBAAAAhL8qpJLhAPEPtgAiAGadyACkAAUPbACKku4PYwD0AI4PfZIPAdAN9gAnACue9QD+AEAPsQAok+4NAAEFAfgOKJKUAOEP3ACNAVidgQA4AGsPBQAlkvINuQDQANEPz5LFABgPzgAqAEedtQAIAWIPIAC8khMPzwCNADsPi5IkAekPawDYAdyfvABkAPYMOwB7kg0LRABpAKEPRZI6AeALTwCKAf6fcgAeAOcPagC1kvYPkQD7ABwOYJLXAFgPkQDPAeSc7wDKAB4MGAAHk0cP2AB+ALAPnJI1AXUPXwDkAcufVQAyAeQNrwBAk/YPygA9ADwPX5I8AOoPtgDOAO+fnJJ63OYYaHLhwCwiRQrpE3/symuT8qru+vSffWrlEPmp8vrgwBKRYYf1VQS5/sATOYokIuH72fwD+f6Ddn3Hi3f7Ihu3ec7/xYeSgc57OZjD/NP/Vf50ttK20AZZCyYUoP7JcJ/h4gCehcchmWfc/woNWYgI+gaAwHRdCw3/2QvReogJqoFa/n/78gjqEMf/8322hQdpkP3J6oYS6B59lUwbyX/2/kr/fWW/5KLh6fjLCHp6awxHg1uLpAgdgOT7EQ2V8i8JNZjgBj4JYXhrgQr4tIyWicaXYfsNf8TidRUNBXzvXZkkF/n/OggTBj+Ak4FyBuuJAPrDZAoH/tLt37J4JNQAAnYgCwTFTAT5ggoAcgBpBMJGbcHCDACGAK7CYMpZBACYAGuyBQQ4AWnAXQkAeQBt+UXAAwDVAL/DA5JdAWnCVsHCARaRcfyDwAgAEAZ0UP/CwGAHAdcZjVDC/osOALnmbcVSdVVzwAoAqyRgU0tFwxgBEeCGelOFZG1kU8BNGQWAMoyDkGvABMDFUv7AwMH/dAYLBO03cML+w8CHfAKTEzuD/4MGxYE49v5kCAESREX/f1DCGQERUIOukVzhwMBJWWkQxaZf/8PAZMDAwAXAdFAGARFdhnBEBgTQaWt3whkB1GmHy3HCcGtSdAVvApJEbV5m/xnEB3AWaojC/sLAp2ZtyMAHAPh+gwT+weYFANaBcGHDANUY9v4rCgDLSnTF5mjBBgDTkMX/RIMBpZJrwcCxWXxT/8DCBgDNZwD7qQcAzagJVzoRBYCpk8JxwoMFwcRTw3sLAKq0rMCPUcHDQwQAsnH6NJcB6bYM/inAAOwuF8H9/wQAC8QItQgAxsWAxAeRx24MAOnHl8NNmcdTggUAzskXO//5lgHxyRpEDsW8ypH7/yc2J8DAAOtcIcAwBQC8EBD5b/wKAGHWXrJTxFILAGXaVlwHMvqWAabj7fr6wQCxd2zEwAoA+yAm+m9pKhAAvef1G/u2gmbUBAC2LlpGmgG871P+/jrATp0B0fE6Izs6//tt///BCwDMN0Y3bP7/wfz/BsVg8sHDwC4EAGYySV2aEfEBPUA/zRDzkzs2KwoQ2sJJNKL+/gcQh1y/PmmaEeAHQzArwhD7m0HAwCkHEcEJPq4/BBCyDF7qBhQcD2ZbwAQQUDZwxwYQiWh6/4f+";
		boolean flag = JavaToBiokey.NativeToProcess(s1, s2);
		renderText(flag ? "true" : "false");
	}
}
