

     /**
 * @Description 生成随机数
 * @Author: wenxin
 * @Date: 2014-04-15
 */
function getRandomNum() 
{
    var random = parseInt(Math.random() * 10000);
    return random;
}
/**
 * 对特殊字符进行转义(+、&、%)
 * @author wenxin
 * @create 2013-08-05 17:20:31 pm
 * @param obj 需要转义的字符
 */
function transferredMeaning(src)
{
	src = src.replace(/\+/g, "%2B");
	src = src.replace(/&/g, "%26");
	src = src.replace(/\%/g, "%25");
	src = src.replace(/\//g, "%2F");
	src = src.replace(/\?/g, "%3F");
	src = src.replace(/\#/g, "%23");
	src = src.replace(/\=/g, "%3D");
	src = src.replace(/\ /g, "%20");
	return src;
}
/**
 * @Description: 计算字符串长度(可同时字母和汉字，字母占一个字符，汉字占2个字符)
 * @Author: ob.huang 黄玲彬
 * @Modified By:
 * @Date: 2013-09-24
 * @param: 
 */
function strlen(str)
{  
    var len = 0;  
    if(str != null)
    {
   		for (var i=0; i<str.length; i++)
    	{   
			var c = str.charCodeAt(i);
			if ((c >= 0x0001 && c <= 0x007e) || (0xff60<=c && c<=0xff9f)) 
			{
				len++;   
			}	
			else 
			{
				len+=2;   
			}
    	}
    }
    return len;
}  