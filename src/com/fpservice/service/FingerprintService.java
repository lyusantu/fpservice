package com.fpservice.service;

import java.util.List;

import com.jfinal.plugin.activerecord.Db;
import com.jfinal.plugin.activerecord.Record;

public class FingerprintService {

	public List<Record> listFingerprints(String table, String id,String uid, String finger,String sid,String sid_key) {
		StringBuffer buf = new StringBuffer();
		buf.append("select " + id + "," + uid + "," + finger + " from " + table);
		if(sid_key != null && !"".equals(sid_key) && sid != null && !"".equals(sid))
			buf.append(" WHERE " + sid_key + " = " + sid );
		return Db.find(buf.toString());
	}

	public List<Record> getUserFingers(String table, int uid, String sid, String uid_key,String fingerNum,String flag_key, String sid_key) {
		StringBuffer buf = new StringBuffer();
		buf.append("select " + fingerNum + " from " + table + " where " + uid_key + " = " + uid + " AND " + flag_key + " = 1");
		if(sid_key != null && !"".equals(sid_key) && sid != null && !"".equals(sid))
			buf.append(" AND " + sid_key + " = " + sid);
		return Db.find(buf.toString());
	}

	public boolean updateLoginInfo(String table,String loginTime_key,long loginTime,String id_key,int id) {
		String sql = "UPDATE " + table + " SET " + loginTime_key + " = " +loginTime + " WHERE " + id_key + " = " + id;
		return Db.update(sql) > 0;
	}

	public boolean delUserFinger(String table, String uid_key, int uid, String fingerNum_key,int fingerNum, String flag_key, int flag) {
		String sql = "UPDATE "+table+" SET "+flag_key+" = ? WHERE "+uid_key+" = ? AND "+fingerNum_key+" = ?";
		return Db.update(sql,flag,uid,fingerNum) > 0;
	}

	public void commitUserFingers(String table,String uid_key,int uid,String flag_key){
		String sqlUpdate = "UPDATE " + table + " SET " + flag_key + " = 1 WHERE " + flag_key + " = 0 AND " + uid_key + " =" + uid;
		Db.update(sqlUpdate);
		String sqlDelete = "DELETE FROM " + table + " WHERE " + flag_key + " = -1 AND " + uid_key + " = " + uid;
		Db.update(sqlDelete);
	}

	public void rollBackUserFingers(String table,String uid_key,int uid,String flag_key){
		String sqlUpdate = "UPDATE " + table + " SET " + flag_key + " = 1 WHERE " + flag_key + " = -1 AND " + uid_key + " =" + uid;
		Db.update(sqlUpdate);
		String sqlDelete = "DELETE FROM " + table + " WHERE " + flag_key + " = 0 AND " + uid_key + " = " + uid;
		Db.update(sqlDelete);
	}

	public boolean addFp(Record record, String tableName) {
		return Db.save(tableName, record);
	}

}
