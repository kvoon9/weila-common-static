var step1Url, step2Url;

var huaweiPattern = /HUAWEI/;
var xiaomiPattern = /XIAOMI/;
var redmiPattern = /REDMI/;
var oppo = /OPPO/;
var vivo = /VIVO/;
var samsung = /SAMSUNG/;
var zte = /NUBIA/;
var meizu = /MEIZU/;
var androidVer;
var brand;
var type = GetQueryString("type");
var brandWord = GetQueryString("brand");
var verint = GetQueryString("verint");

function GetQueryString(name)
{
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if(r!=null)return  unescape(r[2]); return null;
}

function changeFrameHeight(){
    var ifm= document.getElementById("main");
    ifm.height=document.documentElement.clientHeight;
    ifm.width=document.documentElement.clientWidth;
}

window.onresize=function(){ changeFrameHeight();}
$(function(){changeFrameHeight();});



if (brandWord) {
    brandWord = brandWord.toUpperCase();
}



if (brandWord) {
    if (huaweiPattern.test(brandWord)) {
        brand = "HUAWEI";
    }else if (xiaomiPattern.test(brandWord) || redmiPattern.test(brandWord)) {
        brand = "XIAOMI";
    }else if (oppo.test(brandWord)) {
        brand = "OPPO";
    }else if (vivo.test(brandWord)) {
        brand = "VIVO";
    }else if (samsung.test(brandWord)) {
        brand = "SAMSUNG";
    }else if (zte.test(brandWord)) {
        brand = "NUBIA";
    }else if (meizu.test(brandWord)) {
        brand = "MEIZU";
    }else {
        brand = "OTHER";
    }
}


if (verint) {
    verint = parseInt(verint);
    switch (verint) {
        case 23: {
            androidVer = '6';
        }
        break;

        case 24:
        case 25: {
            androidVer = '7';
        }
        break;

        case 26:
        case 27: {
            androidVer = '8';
        }
        break;

        case 28:
        case 29:{
            androidVer = '9';
            if (brand === 'XIAOMI' && verint === 29) {
                androidVer = '10';
            }
        }
        break;

        default: {
            androidVer = 'F';
        }
        break;
    }
}

if (brand && androidVer) {
    if (androidVer !== 'F') {
        if (brand !== 'OTHER') {
            step1Url = "/pages/" + brand + "/" + brand + "_" + androidVer + "_step1.html";
            if (brand === 'SAMSUNG' || brand === 'MEIZU') {
                step2Url = "/pages/" + brand + "/" + brand + "_step2.html";
            }else {
                step2Url = "/pages/" + brand + "/" + brand + "_" + androidVer + "_step2.html";
            }
        }else {
            step1Url = "/pages/" + brand + "/" + brand + "_" + androidVer + "_step1.html";
            step2Url = "/pages/" + brand + "/" + brand + "_" + "default_step2.html";
        }
    }else {
        step1Url = "/pages/OTHER/OTHER_10_step1.html";
        step2Url = "/pages/OTHER/OTHER_default_step2.html";
    }
}else {
    step1Url = "none_step1.html";
    step2Url = "none_step2.html";
}

var lastUrl;

if (type) {
    if (type == '1') {
        lastUrl = step1Url;
    }else {
        lastUrl = step2Url;
    }
}else {
    lastUrl = "error.html";
}

$("#main").load(lastUrl, function (response, status, xhr) {
    if (status == "success") {
	    $("#main").attr("src", lastUrl);
    }else {
        $("#main").attr("src", "declaire.html");
    }
});

