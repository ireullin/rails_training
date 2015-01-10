#!/usr/bin/env phantomjs

var g_webpage = {};
var APIURL = 'http://127.0.0.1:3000';

function onConsoleMessage(message)
{
    printLog( 'onConsoleMessage:', message );
}


function onError(message, trace)
{
    printLog( 'onError:', message, trace );
}

function printLog()
{
    var args = Array.prototype.slice.call(arguments);
	var d = new Date();
	var strDate = '[' + d.getFullYear() + '/' + d.getMonth() + '/' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + '] ';
	console.log( strDate + args.join(' ') );
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function insertToDB(data)
{
	printLog( 'enter', arguments.callee.name );

	g_webpage['insert'] = require('webpage').create();
	g_webpage['insert'].onError = onError;
	g_webpage['insert'].onConsoleMessage = onConsoleMessage;
	g_webpage['insert'].open(APIURL+'/lottery/new.json', 'POST', 'data=' + data,  function(status){

		if(status!='success')
		{
			printLog('stop the process with status', status);
			phantom.exit();
		}

		//g_webpage['insert'].render("debug.png");

		doc = g_webpage['insert'].evaluate(function(s){
			return document.body.innerText;
		});

		printLog('post of response:', doc );
		phantom.exit();
	});

}



function onClickLotteryPage(status)
{
	printLog( 'enter', arguments.callee.name );

	if(status!='success')
	{
		printLog('stop the process with status', status);
		phantom.exit();
	}

	if(!g_webpage['lottery'].injectJs('jquery-1.11.1.js'))
	{
		printLog('stop the process with injecting jquery failed', status);
		phantom.exit();
	}

	//g_webpage['lottery'].render("debug.png");

	var rc = g_webpage['lottery'].evaluate(function(){

		var twDate = $('#SuperLotto638Control_history1_dlQuery_Date_0').text().split('/');
		var adDate = parseInt(twDate[0]) + 1911 + '/' + twDate[1] + '/' + twDate[2];

		var data = {
			'term': $('#SuperLotto638Control_history1_dlQuery_DrawTerm_0').text(),
			'announced_at': adDate,
			'no1':$('#SuperLotto638Control_history1_dlQuery_SNo1_0').text(),
			'no2':$('#SuperLotto638Control_history1_dlQuery_SNo2_0').text(),
			'no3':$('#SuperLotto638Control_history1_dlQuery_SNo3_0').text(),
			'no4':$('#SuperLotto638Control_history1_dlQuery_SNo4_0').text(),
			'no5':$('#SuperLotto638Control_history1_dlQuery_SNo5_0').text(),
			'no6':$('#SuperLotto638Control_history1_dlQuery_SNo6_0').text(),
			'special':$('#SuperLotto638Control_history1_dlQuery_SNo7_0').text(),

			'type':'superlottos'
		};

		return JSON.stringify(data);
	});

	printLog( 'got lottry data:', rc );
	insertToDB(rc);
}



function clickLotteryPage(term)
{
	printLog( 'enter', arguments.callee.name );
	printLog( 'new term is', term );

	g_webpage['lottery'] = require('webpage').create();
	g_webpage['lottery'].onError = onError;
	g_webpage['lottery'].onConsoleMessage = onConsoleMessage;
	g_webpage['lottery'].open('http://www.taiwanlottery.com.tw/lotto/superlotto638/history.aspx', 
		function(status){

			if(status!='success')
			{
				printLog('stop the process with status', status);
				phantom.exit();
			}

			if(!g_webpage['lottery'].injectJs('jquery-1.11.1.js'))
			{
				printLog('stop the process with injecting jquery failed', status);
				phantom.exit();
			}

			g_webpage['lottery'].onLoadFinished = onClickLotteryPage;

			g_webpage['lottery'].evaluate(function(term){
				$('#SuperLotto638Control_history1_radYM').prop('checked', false);
				$('#SuperLotto638Control_history1_radNO').prop('checked', true);
				$('#SuperLotto638Control_history1_txtNO').val(term);
				$('#SuperLotto638Control_history1_btnSubmit').trigger('click');
				return null;
			}, term);

		}
	);
}



function onGetNewest(status)
{
	printLog( 'enter', arguments.callee.name );

	if(status!='success')
	{
		printLog('stop the process with status', status);
		phantom.exit();
	}

	var doc = g_webpage['newest'].evaluate(function(s){	return document.body.innerText;});
	var newestObj = JSON.parse(doc);

	printLog( 'get of response:', doc );
	clickLotteryPage( parseInt(newestObj.term) + 1);
}



function getNewest()
{
	printLog( 'enter', arguments.callee.name );

	g_webpage['newest'] = require('webpage').create();
	g_webpage['newest'].onError = onError;
	g_webpage['newest'].onConsoleMessage = onConsoleMessage;
	g_webpage['newest'].onLoadFinished = onGetNewest;
	g_webpage['newest'].open(APIURL+'/lottery/newest/superlottos.json');
}


function main()
{
	printLog( 'enter', arguments.callee.name );
	getNewest();
	setTimeout(function(){  
		printLog( 'stop the process with timeout' );
		phantom.exit();
	}, 60*1000);
}


main();
