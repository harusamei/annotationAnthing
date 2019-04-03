//  ∵~★．°☆∵。*∵~★．°☆∵。*∵~★．°☆∵。*
//      author: mengyao@cn.fujitsu.com
//  ∵~★．°☆∵。*∵~★．°☆∵。*∵~★．°☆∵。*
//    default:
//  区间表示为 [beg,end), beg包含在区间内，end不包含
//  位置表示为 pos, 为基于整个TXT内容的绝对位置，包括MARKDOWN的功能符号
//  TXid 放置在包裹text的DOM element上，即text.parentNode
//  前缀， MK, TX, CE, ST, that is, notation, text, cell, superscript
//  this is my garden, there are banyan, mosses, and truffles
////////////////////////////////////////////////////////////////////////////////
'use strict';

function assignObj(aObj, bObj){
    if ($.type(aObj)!='object' || $.type(bObj)!='object') {
        return {}//code
    }
    for(var fe in bObj){
        aObj[fe]=bObj[fe]
    }
    return aObj;
}

$(function () {

   if($('.article-root').length<1){
      return
   }
   ARTICLE_MAK_natation.init($('.article-root')[0]);
   var tMark={
                id:"MK49767",  // 注释的id需要以MK开头
                authorId:10,
                bCh:0,
                bLn:3,
                content:"taken", //选中内容
                eCh:5,
                eLn:3,
                remark:"",      //注释很多时，备注
                translation:"乘坐" 
   }
   $('#PUB_YOYAKU')[0].allMarks={"MK49767":tMark}
   if (Object.keys($('#PUB_YOYAKU')[0].allMarks).length>0) {
     ARTICLE_MAK_natation.paintMarks($('#PUB_YOYAKU')[0].allMarks)   
   }

});
function clickCENode(aNode) {
    var markIdList=ARTICLE_MAK_natation.getMarkIdList(aNode.id);
    if (markIdList.length>0 && aNode.id.substr(0,2)=='CE') {
        $('#PUB_YOYAKU').trigger('/event/notation/flip',[aNode,markIdList]);      
    }
}

$('.article-root').click(function(event){
        
    var aNode=event.target;
    var markIdList=ARTICLE_MAK_natation.getMarkIdList(aNode.id);
    if(markIdList.length>0 && aNode.id.substr(0,2)=='ST'){
        $('#PUB_YOYAKU').trigger('/event/panel/show',[markIdList]);
    }else if (markIdList.length>0 && aNode.id.substr(0,2)=='CE') {
        $('#PUB_YOYAKU').trigger('/event/notation/flip',[aNode,markIdList]);      
    }
})
$('.article-root').mouseup(function(event){
        
   var aRange=document.getSelection();
   if (aRange.toString()=='' ||aRange.rangeCount!=1) {
      return;
   }
  
   if(aRange.anchorNode==aRange.focusNode && aRange.anchorOffset==aRange.focusOffset){
      return;
   }
   if (aRange.anchorNode.nodeType!=3 || aRange.focusNode.nodeType!=3){
      console.assert('has untext node in the selection');
      return;
   }
   var nodes=ARTICLE_MAK_natation.getNodesInRange(aRange.getRangeAt(0))
   //判断是否都是元素全为上标
   var notAllST=nodes.some(function(aNode){
       var temStr=aNode.parentNode.id
        if (temStr && temStr.indexOf('ST')>=0) {
             return false;   
        }else{
             return true;
        } 
   })
   if (!notAllST) {
       return; 
   }
   //判断是否翻牌元素
   var isFlip=nodes.some(function(aNode){
        var temStr=$(aNode.parentNode).attr('flip')
        if ($(aNode.parentNode).attr('flip') && $(aNode.parentNode).attr('flip')=='true') {
             return true;   
        }else{
             return false;
        }
   })
   if (isFlip) {
       $('#PUB_YOYAKU').trigger('/event/notation/restoreSome',[nodes]);
       return;
   }
   //判断是否已经有注释
   var newMark=ARTICLE_MAK_natation.triggerSelect(aRange)
   //不能正确获取位置
   if (!newMark) {
        return;
   }
   var isSameRange=false;
   var temMark={};
   var allMarks=$('#PUB_YOYAKU')[0].allMarks
   var lnSize=ARTICLE_MAK_natation.mixedSections.maxLnSize
   for(var id in allMarks ){
        temMark=allMarks[id]
        if (temMark.beg==newMark.bLn*lnSize+newMark.bCh && temMark.end==newMark.eLn*lnSize+newMark.eCh) {
             isSameRange=true;
             newMark.id=id
             break
        }
   }
   //update by Meng
   var uAgent=navigator.userAgent
   var notIE=(uAgent.indexOf('MSIE')==-1 && uAgent.indexOf('rv')==-1)
   if(notIE){
       aRange.empty();
   }else{  //for IE
       aRange.removeAllRanges(); 
   }
   //不能给空加注释
   if (newMark.content=='') {
        alert('内容不能为空或全是空格:-[')
        return//code
   }
   if (newMark.content.length>199) {
        alert('长度不能超过200字符:-(')
        return//code
   }
   if (isSameRange) {
       $('#PUB_YOYAKU').trigger('/event/panel/show',[[newMark.id]]) 
   }else{
       $('#PUB_YOYAKU').trigger('/event/panel/create',[newMark])
   }
   return;
})
//约定， 所有自己生成的事件， 以‘/event/’前缀
$('#PUB_YOYAKU').on('/event/notation/create',function(eve,aNotation){
        
      var temMark=ARTICLE_MAK_natation.markFrom(aNotation,$('#PUB_YOYAKU')[0].waitingMark)
      $('#PUB_YOYAKU')[0].allMarks[temMark.id]=temMark
      $('#PUB_YOYAKU')[0].waitingMark=null;
      
      ARTICLE_MAK_natation.createMarks([temMark]);
      //show translation, update by Meng 2018-4-6
      var tCe=ARTICLE_MAK_natation.getCeIdListByMk(temMark.id)
      if (tCe && tCe.length>0) {
        clickCENode($('#'+tCe[0])[0])//code
      }      
      
});
$('#PUB_YOYAKU').on('/event/notation/delete',function(eve,notationId){
    var aMark=$('#PUB_YOYAKU')[0].allMarks['MK'+notationId]
    if (aMark) {
        ARTICLE_MAK_natation.delMarks([aMark])
        delete $('#PUB_YOYAKU')[0].allMarks[aMark.id];
    }
});
$('#PUB_YOYAKU').on('/event/notation/update',function(eve,aNotation){
      
      var aMark=$('#PUB_YOYAKU')[0].allMarks['MK'+aNotation.notationId]
      $('#PUB_YOYAKU')[0].allMarks['MK'+aNotation.notationId]=ARTICLE_MAK_natation.markFrom(aNotation,aMark);      
});
//还原翻牌
$('#PUB_YOYAKU').on('/event/notation/restoreSome',function(eve,nodes){
    var markIdList=[],
        cellIdList=[];
    var temStr='';
    nodes.forEach(function(aNode){
        temStr=$(aNode.parentNode).attr('flip')
        if (!temStr || temStr!='true'){
           return;     
        }
        markIdList=ARTICLE_MAK_natation.getMarkIdList(aNode.parentNode.id)
        ARTICLE_MAK_natation.restoreFlip(aNode.parentNode, markIdList)
    })
});
//翻牌
$('#PUB_YOYAKU').on('/event/notation/flip',function(eve,tgNode,mkIds){
     
   var temAttr=$(tgNode).attr('flip');
   if(temAttr && temAttr=='true'){
        ARTICLE_MAK_natation.restoreFlip(tgNode,mkIds)
        return;
   }
   var ceList=[];
   var allConts=[];
   var temMark={};
   mkIds.forEach(function(id){
      ceList=ceList.concat(ARTICLE_MAK_natation.getCeIdListByMk(id))
      temMark=$('#PUB_YOYAKU')[0].allMarks[id]
      //大家觉得翻牌时只要译文更好
      //翻牌时的样式  update by Meng
      allConts.push(/*temMark.content+'/'+*/temMark.translation.trim())
   })
   ceList=ceList.sort()
   var preX=null
   ceList=ceList.filter(function(item){
        if (item!=preX) {
           preX=item
           return true;
        }else{
           return false;
        }
   })
   //HIDDEN
   $(tgNode).attr('oriHtml',$(tgNode).html())
   //翻牌样式，带中括号或不带 update by Meng
   $(tgNode).html(allConts.join('/'))
   //$(tgNode).html('['+allConts.join('][')+']')
   $(tgNode).attr('flip',true)
   $(tgNode).attr('ceList',ceList.join(';'))
   
   ceList.forEach(function(id){
     if (id!=tgNode.id) {
        $('#'+id).css('display','none')     
     }
   })
});

var temMarkArr = []
$('#PUB_YOYAKU').on('/event/panel/show',function(eve,mkIds){
    temMarkArr = []
    var notationWordsHTML = ''
    var temMark={}
    var tAllMarks=$('#PUB_YOYAKU')[0].allMarks
    for (var i = 0; i < mkIds.length; i++) {
        temMark=$('#PUB_YOYAKU')[0].allMarks[mkIds[i]]
        if (temMark.content.length>10) {
           var match=/^(.{5}).*(.{5})$/.exec(temMark.content)  
           temMark.content=match[1]+'...'+match[2]
        }
        notationWordsHTML += '<span data-id="' + temMark.id + '">' + temMark.content + '</span>'
        temMarkArr.push(temMark)
    }
    $('.notation-panel-2-words').html(notationWordsHTML)
    $('.notation-panel-2-words span').first().trigger('click')
    // $('.mask').show();
    // $('.notation-panel-2').show();
});

$('#PUB_YOYAKU').on('/event/panel/create',function(eve,temMark){
    
    $('#PUB_YOYAKU')[0].waitingMark=temMark
    
    //$('.mask').show();
    $('.notation-panel').show();
    $('.notation-panel').find('.notation-panel-words').text(temMark.content);
    var temPos={startCharPos:temMark.bCh, endCharPos:temMark.eCh, startSentId:temMark.bLn,endSentId:temMark.eLn}
    
    $('#notationPositions').text(JSON.stringify(temPos))
    //$('.notation-panel').find('.notation-panel-ask').attr('href', '/common/askmp?words=' + encodeURIComponent(temMark.content));
});
// 取消
$('.notation-panel-cancel').click(function () {
    $('.mask').hide();
    $(".notation-panel-dictionary").attr('disabled',false)
    $(".notation-panel-dictionary").css("color","#3f6bb8")
    $('.notation-panel').hide();
    // 清空用户输入内容
    $('.notation-panel').find('textarea').val('');
    // 清空标签
    $('.new-article-labels-container').html('');
    // 删除标注
    $('.last-label').replaceWith($('.last-label').text());
    // 清空notationId
    $('.notation-panel-words').attr('notationId',-1)
    //$('#notationMenu').hide()
});

///////////////////////////
//创建，更新注释pannel                             
$('.notation-panel-ok').click(function () {
    // $(".notation-panel-dictionary").attr('disabled',false)
    // $(".notation-panel-dictionary").css("color","#3f6bb8")
    //$('#notationMenu').hide()
  
    //来源文章
    var fromArtEle=$('.notation-panel-fromArtId')
    var fromArtInfo=null
    if (fromArtEle.length) {
        fromArtInfo={   artTitle:fromArtEle.text(),
                        href:fromArtEle.attr('href')
                    }//code
    }
    // 原文
    var yuanwen = $('.notation-panel-words').text().trim();
    // 注释
    var zhushi = $('.notation-panel-zhushi').val().trim();
    if (yuanwen=='' || zhushi=='') {
        alert('原文或注释不能为空')
        return;
    }
    //var conx=$('#notationConx')[0].innerHTML
    // 备注
    var beizhu = $('.notation-panel-beizhu').val().trim();
    
    zhushi=zhushi.replace(/\r*\n+/gm,'\n')
    zhushi=zhushi.replace(/\n/gm,'<br/>').replace(/\s/g,"&nbsp;")
    
    //备注换行
    beizhu=beizhu.replace(/\r*\n+/gm,'\n')
    beizhu=beizhu.replace(/\n/gm,'<br/>').replace(/\s/g,"&nbsp;")
    
    if (yuanwen.length >= 200) {
        alert('原文不能超过200个字符')
        return
    } else if (zhushi.length >=200) {
        alert('注释不能超过200个字符')
        return
    } else if (beizhu.length >= 500) {
        alert('备注不能超过500个字符')
        return
    }
    //TODO, 此处articleId大概应该改为URL， 怎么获得URL？
    var articleId=$(this).attr('articleId')
    var api='/mark/create'
    // 原文， 注释， 备注 和TAGS
    //POST FORMAT BY meng 0908
    var postData={
        'articleId':articleId,
        'words':yuanwen,
        'translation':zhushi,
        'remark':beizhu,
     }
     
     var notationId=$('.notation-panel-words').attr('notationId')
     var temMark={}
     if (parseInt(notationId)>=0) {
        api='/mark/update'
        postData.notationId=notationId;
        if($('#PUB_YOYAKU')[0]){
            temMark=$('#PUB_YOYAKU')[0].allMarks[notationId]
        }else{
            temMark=null
        }
     }else{
         // 取数据
        // add 取位置信息， 位置信息已保存为JSON格式
        var temPosi=$('#notationPositions').text();
        temPosi=JSON.parse(temPosi)
        //Object.assign(postData,temPosi); 
        postData=assignObj(postData,temPosi) //update 170331s    
        temMark=$('#PUB_YOYAKU')[0].waitingMark
     }
    //记录位置信息
    //bLn=-1的位置已由triggerAword找到
    //update by Meng 2018-2-24
    if (temMark) {
        postData.startCharPos=temMark.bCh
        postData.startSentId=temMark.bLn
        postData.endCharPos=temMark.eCh
        postData.endSentId=temMark.eLn//code
    }
    
    $('.notation-panel-words').attr('notationId','-1');
    // 清空用户输入内容
    $('.notation-panel').find('textarea').val('');
    // 清空标签
    $('.new-article-labels-container').html('');
    // 删除类
    $('.last-label').removeClass('last-label');
    //遮罩延迟撤销  by Meng
    setTimeout(function(){$('.mask').hide()},500)
    $('.notation-panel').hide();
    //TODO 传数据
    pseudoPost(api, postData,function(backData){
        
        if(!backData.meta.success){
            alert('出错了，不能注释或保存不了')
        }else{
            var newNotationHTML
            var savedNotation=postData
            savedNotation.authorId=$('#user').attr('userid')
            //已经填写在页面上
            if (parseInt(notationId)>=0) {
                
                $('#' + notationId).replaceWith(newNotationHTML)
                $('#PUB_YOYAKU').trigger('/event/notation/update',[savedNotation]);
            }else{
                // 把新创建的注释添加到注释中
                savedNotation.id=backData.data.notationId;
                $('#PUB_YOYAKU').trigger('/event/notation/create',[savedNotation]);//code
                // 尾标注释数字变化
                //$('.article-excerpt-meta-number').text(parseInt($('.article-excerpt-meta-number').text()) + 1);
            }
            alert('保存成功')
        }
        
    })
    
});
//TODO,  传给后台
// 两个API，  api='/mark/update',  /mark/create
var pseudoPost=function(api, postData, callBack){
    var result={'meta':{success:true,message:''},
                'data':{nationId:'MK49768'}}
    callBack(result)
}

////////////////////////////////////////////////////////////
var ARTICLE_MAK_natation={              //对象字面量模式
   // isClick:false,
    mixedSections:{},
    markViewer:{},
    controller:{},
    init:function(naiyoRoot){
     if (!naiyoRoot) {
        return//code
     }
     this.controller.init(naiyoRoot);
    },
    //非常危险的函数，导致parseNotation 抽出的信息被去掉
    markFrom:function(aNotation,aMark){
        //id follows notation, Ln, ch, follow mark
        aNotation.notationId=aNotation.id=aNotation.notationId||aNotation.id
        
        var tMark={id:'MK'+aNotation.notationId}
        var ftList1='bLn,eLn,bCh,eCh,content'.split(',')
        var ftList2='translation,words,remark,tags,authorId'.split(',');
        tMark.id=tMark.id.replace('MKMK','MK')
        ftList1.forEach(function(ft){
           if (aMark[ft]!=null) {
             tMark[ft]=aMark[ft]      
           }else if (aNotation[ft]!=null) {
             tMark[ft]=aNotation[ft]     
           }
        })
        ftList2.forEach(function(ft){
           if (aNotation[ft]!=null) {
             tMark[ft]=aNotation[ft]     
           }else if (aMark[ft]!=null) {
             tMark[ft]=aMark[ft];   
           }
        })
        var lnSize=this.mixedSections.maxLnSize
        if (tMark.bLn!=null) {
           tMark.end=tMark.eLn*lnSize+tMark.eCh;
           tMark.beg=tMark.bLn*lnSize+tMark.bCh;     
        }
        if (tMark.content) {
            tMark.data=tMark.content    
        }
        return tMark
    },
    triggerSelect:function(aRange){
        //NOTE: css noselection can not change the real selection
       return this.controller.triggerSelect(aRange); 
    },
    getCellIdList:function(){
        var tCellSet=this.mixedSections.AllCellSet
        return Object.keys(tCellSet)
    },
    getMarkIdList:function(id){
        
        if (!id || (id.substr(0,2)!='ST' && id.substr(0,2)!='CE')) {
            return []    
        }
        var temX=this.mixedSections.getSection(id);
        if (temX && temX.mkIds) {
            return temX.mkIds    
        }
        return []
    },
    getCeIdListByMk:function(mkId){
      var temMark=this.mixedSections.getSection(mkId);
      if (temMark && temMark.cellIds) {
        return temMark.cellIds;
      }else{
        return [];
      }
    },
    getNodesInRange:function(aRange){
       return this.controller.getNodesInRange(aRange)
    },
    createMarks:function(markList){
       markList.forEach(function(item){
        if (item.id=='-1') {
           alert('mark.id error:'+JSON.stringify(item))     
        }
       });
       this.controller.createMarks(markList); 
    },
    delMarks:function(markList){
        markList.forEach(function(item){
        if (item.id=='-1') {
           alert('mark.id error:'+JSON.stringify(item))
        }
       });
        this.controller.delMarks(markList);
    },
    restoreFlip:function(tgNode,mkIds){
        var ceList=[];
        var allConts=[];
        mkIds.forEach(function(id){
           ceList=ceList.concat(ARTICLE_MAK_natation.getCeIdListByMk(id))
        })
        ceList=ceList.sort()
        var preX=null
        ceList=ceList.filter(function(item){
             if (item!=preX) {
                preX=item
                return true;
             }else{
                return false;
             }
        })
        ceList.forEach(function(id){
          if (id!=tgNode.id) {
             $('#'+id).css('display','')     
          }
        })
        $(tgNode).attr('flip',false)
        $(tgNode).html($(tgNode).attr('oriHtml'))   
    },
    paintMarks:function(notations){
        
        var aMark={};
        var markList=[]
        var temItem={};
        var editedNotations=[]
        var maxLn=this.mixedSections.maxLn      //没有对应上的结点行号>=500
        for(var i in notations){
            temItem=notations[i]
            if (temItem.content==null) {
               continue; 
            }
            //没有对应到mdContent上的结点的注释，基于单词查询  update 20170306 by Meng
            // 标注两种情况失去位置, 1.网页与mdcontent匹配不上，没有正常行即> maxLn
             // 2. 文章重新编辑了 重置为-1
             // >maxLn也可以找到位置，只是不能计算编辑后的修改位置
            if (temItem.bLn!=null && /*temItem.bLn<maxLn && */temItem.bLn>=0) {
                aMark={bLn:temItem.bLn,eLn:temItem.eLn,bCh:temItem.bCh,eCh:temItem.eCh}
            }else{
                aMark=this.controller.triggerAword(notations[i].content);
                //重新记录位置信息 by Meng  2018-2-24
                if (aMark) {
                    notations[i].bLn=aMark.bLn
                    notations[i].eLn=aMark.eLn
                    notations[i].eCh=aMark.eCh
                    notations[i].bCh=aMark.bCh//code
                }else{
                    console.log('no position in page'+JSON.stringify(notations[i]))
                }
            }
            //补充notation信息
            if (aMark) {
                notations[i]=this.markFrom(notations[i],aMark)
                markList.push(notations[i])
            }
        }
        this.createMarks(markList)
        return editedNotations
    }
};
//管理各类区间，包括， HTML中的text元素， mark标注, mark,text元素分隔出的单元cell
ARTICLE_MAK_natation.mixedSections=(function truffle(){         //模块模式，包含私有，return 中为公有
    
    var txSet={},       //map, 'TX'id:[beg,end, cellIds, data], cellIds should sorted by position
        markSet={},     //map,  'MK'id:[beg,end, length, cellIds]
        cellSet={},     //map, 'CE'id:{beg, end, length, mkIds, txId}
        //note: the id,cell.end is not the position of sup element in the dom
        supSet={};       //map, superScript, 'ST'id:{count, mkIds, cellId}, id=mark.end=cell.end
        
    var borderList=[];   //{pos,pId}     beg position and end position of range
    var changeCells=[];  //{bLn, bCh, eLn, eCh, id, txId,stat}     stat '+' means new cell, stat'-' means del cell
        //newCellList=[];  //when update
    //各种最大限度的约定
    var maxLnSize=5000;     //MD内容每行最大字符
    var maxLn=5000;          // 最多5000行
    var	maxTxtSize=5000;   //MD最多5000字符

////////////METHODS//////////////////    
    function addInBorderList(aList){
        aList.forEach(function(tSect){
            var bPos=tSect.beg||tSect.bLn*maxLnSize+tSect.bCh;
            var ePos=tSect.end||tSect.eLn*maxLnSize+tSect.eCh;
            borderList.push({pos:bPos,pId:'B-'+tSect.id});
            borderList.push({pos:ePos,pId:'E-'+tSect.id});
        });
    };
    function buildCellList(){
        
        var cellList=[];
        var cellId=0;
        var preSect=borderList[0];
        var waitMK=0;
        if (preSect.pId.substr(0,4)=='B-MK') {
            waitMK++;
        }else if (preSect.pId.substr(0,4)=='E-MK') {
            waitMK--;
        }
        var isInsideTx=false;
        if (preSect.pId.substr(0,4)=='B-TX') {
            isInsideTx=true;
        }
        var temSect={};
        var unCell={};

        for(var i=1; i<borderList.length; i++){
            
            temSect=borderList[i];
            if (waitMK>0 && preSect.pos!=temSect.pos &&isInsideTx) {
               cellList.push({beg:preSect.pos,end:temSect.pos});
            }/*else{
                console.log(preSect.pId+preSect.pos+','+temSect.pId+temSect.pos);
            }*/
            preSect=temSect;
            if (preSect.pId.substr(0,4)=='B-MK') {
                waitMK++;
            }else if (preSect.pId.substr(0,4)=='E-MK') {
                waitMK--;
            }
            if (preSect.pId.substr(0,4)=='B-TX') {
                isInsideTx=true;
            }else if (preSect.pId.substr(0,4)=='E-TX') {
                isInsideTx=false;
            }
        };
        return cellList;
    };
    function compareSect(a,b){
        //null
        if (!a && !b) {
           return 0;
        }else if (!b) {
           return 1;
        }else if (!a) {
           return -1;
        }
        if (a.beg>b.beg) {
            return 1;
        }else if(a.beg<b.beg){
            return -1;
        }else if (a.end >b.end) {
            return 1;
        }else if (a.end <b.end) {
            return -1;
        }
        return 0;  
    };
    
    function fillMapInf(dupMarkList){
         
        var temCell={};
        //keep the order of cellset
        var cellLen=Object.keys(cellSet).length
        var temTxId='',
            temMkIds='',
            temId='';
        for(var i=0,j=0; i<cellLen; i++){
            temCell=cellSet['CE'+i];
            cellSet['CE'+i].length=temCell.end-temCell.beg;
            while(borderList[j].pos<temCell.end){
                if (borderList[j].pId.substr(0,4)=='B-MK') {
                    temMkIds+=borderList[j].pId.substr(2);
                }else if(borderList[j].pId.substr(0,4)=='B-TX') {
                       temTxId=borderList[j].pId.substr(2);
                }else if (borderList[j].pId.substr(0,4)=='E-MK') {
                    temId=borderList[j].pId.substr(2);
                    temMkIds=temMkIds.replace(temId,'');
                }
                j++;
            }
            if (borderList[j].pos!=temCell.end) {
                console.log('No.1: wrong in cellList');
                break;
            }
            cellSet['CE'+i].mkIds=(temMkIds.substr(2).split('MK')).sort().map(function(x){return 'MK'+x;});
            cellSet['CE'+i].txId=temTxId;
            
            if (supSet['ST'+cellSet['CE'+i].end]) {
                supSet['ST'+cellSet['CE'+i].end].cellId='CE'+i;
            }
        }//fill mkId, txId for cellSet;
        for(var i in markSet){
            markSet[i].cellIds=[];
            markSet[i].length=0;
        }
        for(var i in txSet){
            txSet[i].cellIds=[];
        }
        for(var i in cellSet){
            temCell=cellSet[i];
            temCell.mkIds.forEach(function(item){
                markSet[item].cellIds.push(i);       //ignore 'CE'
                markSet[item].length+=item.length;
            });
            txSet[temCell.txId].cellIds.push(i);
        }
        dupMarkList.forEach(function(item){
            markSet[item.id].cellIds=markSet[item.sameAs].cellIds;
            markSet[item.id].length=markSet[item.sameAs].length;
        });
        sortCellIdsInTxMk();
    };
    function filterDup(aList){
        //dup means same beg and end
        //判断列表自身的重复
        var dupList=[],
            noDupList=[];
        var uniqObj={};
        var tKey=0,tId=-1;
        aList.forEach(function(item){
            tKey='['+item.beg+','+item.end+']';
            if (uniqObj[tKey]!=null) {
                tId=uniqObj[tKey].id
                //dupList.push(Object.assign({sameAs:tId},item));
                dupList.push(assignObj({sameAs:tId},item));
            }else{
                uniqObj[tKey]=item;
                noDupList.push(item)
            }
        })
        //noDupList=Array.from(uniqObj);  //doesn't work?!
        
        if (Object.keys(supSet).length==0) {
           return {noDup:noDupList,dup:dupList};
        }
        //判断是否与已经生成的mark重复
        var isDup=false;
        noDupList=noDupList.filter(function(item){
          if(!supSet['ST'+item.end]){
            return true;
          }
          isDup=supSet['ST'+item.end].mkIds.some(function(mId){
            if(compareSect(markSet[mId],item)==0){
                item.sameAs=mId;
                return true;
            }else{
                return false;
            }
          });
          if (isDup) {
            dupList.push(item);
            return false;
          }
          return true;
        });
        
        return {noDup:noDupList,dup:dupList};
    };
    function genCellSet(){
        if (borderList.length==0) {
            return;
        }
        borderList=borderList.sort(function(a,b){
            if (a.pos!=b.pos) {
                return a.pos>b.pos?1:-1;
            }else if (a.pId==b.pId) {
                return 0;
            }
            return a.pId<b.pId?1:-1;        //E-TX E-MK B-TX B-MK
        });
        var cellList=buildCellList();
        var cellId=0;
        cellList.forEach(function(item){
            cellSet['CE'+cellId++]=item;
        });
        cellList=[];
    };
    
    function sortCellIdsInTxMk(){
        
        for(var i in txSet){
            txSet[i].cellIds=txSet[i].cellIds.sort(function(a,b){
                return compareSect(cellSet[a],cellSet[b]);
            });
        }
        for(var i in markSet){
            markSet[i].cellIds=markSet[i].cellIds.sort(function(a,b){
                return compareSect(cellSet[a],cellSet[b]);
            });;
        }
    };
    function getChangeCells(newCellList){
        
        var changeList=newCellList.map(function(item,indx){
                item.loc=indx
                item.stat='+'
                return item;
        });
        var item={}
        for(var i in cellSet){
            item=cellSet[i];
            if (item.stat=='-') {
               continue 
            }
            //changeList.push(Object.assign({stat:'-',loc:i,id:i},item))
            changeList.push(assignObj({stat:'-',loc:i,id:i},item))
        }        
        changeList=changeList.sort(compareSect);
        changeList=changeList.filter(function(item,indx){
           if (item.stat=='=') {
              return false;  
           }
           if (indx==changeList.length) {
              return true  
           }
           if (compareSect(item,changeList[indx+1])==0) {
              if (item.stat=='+') {
                newCellList[item.loc].id=changeList[indx+1].loc
              }else{
                newCellList[changeList[indx+1].loc].id=item.loc
              }
              item.stat='='
              changeList[indx+1].stat='='
              return false;
           }
           return true;
        })
        return changeList;
    }
    function updateCells(markList, stat){
        changeCells=[];
        
        if (stat=='-') {
            var temIds=markList.reduce(function(a,b){
                                            return a.id+b.id;
                                      },{id:''});
            temIds+='MK';
            borderList=borderList.filter(function(item){
                return temIds.indexOf(item.pId.substr(2)+'MK')<0;
            });
        }else{
           markList.forEach(function(aMark){
            //位置不正确放弃，否则影响后面排序 add by Meng 2018-4-7
            if (aMark.beg>aMark.end) {
               return
            }
            borderList.push({pos:aMark.beg,pId:'B-'+aMark.id});
            borderList.push({pos:aMark.end,pId:'E-'+aMark.id});
           });
           borderList=borderList.sort(function(a,b){
                                        if (a.pos!=b.pos) {
                                            return a.pos>b.pos?1:-1;
                                        }else if (a.pId==b.pId) {
                                            return 0;
                                        }
                                        return a.pId<b.pId?1:-1;        //E-TX E-MK B-TX B-MK
                                });   
        };
        var newCellList=buildCellList();
        changeCells=getChangeCells(newCellList)
        var newId=Object.keys(cellSet).length;
        changeCells.forEach(function(item,indx){
           if (item.stat=='+') {
              newCellList[item.loc].id='CE'+newId++  
              newCellList[item.loc].stat='+'
           }
           if (item.stat=='-') {
              cellSet[item.loc].stat='-'  
           }
        })
        
        updateOtherInf(newCellList);
        
        //console.log('newCellList:%s',JSON.stringify(newCellList))
        //console.log('cellSet:%s',JSON.stringify(cellSet))
        //console.log('changeCell:%s',JSON.stringify(changeCells))
        newCellList=[];
    };
    function updateOtherInf(newCellList){
        var temCell={};
        //keep the order of cellset
        var temTxId='',
            temMkIds='',
            temId='';
        for(var i=0,j=0; i<newCellList.length; i++){
            temCell=newCellList[i];
            while(borderList[j].pos<temCell.end){
                if (borderList[j].pId.substr(0,4)=='B-MK') {
                    temMkIds+=borderList[j].pId.substr(2);
                }else if(borderList[j].pId.substr(0,4)=='B-TX') {
                       temTxId=borderList[j].pId.substr(2);
                }else if (borderList[j].pId.substr(0,4)=='E-MK') {
                    temId=borderList[j].pId.substr(2);
                    temMkIds+='M';
                    var r=new RegExp(temId+'M');
                    temMkIds=temMkIds.replace(r,'M');
                    temMkIds=temMkIds.substring(0,temMkIds.length-1);
                }
                j++;
            }
            if (borderList[j].pos!=temCell.end) {
                console.log('No.1: wrong in cellList');
                break;
            }
            if (temCell.stat=='+') {
                cellSet[temCell.id]={length:temCell.end-temCell.beg,txId:temTxId,beg:temCell.beg,end:temCell.end};
            }
            cellSet[temCell.id].mkIds=(temMkIds.substr(2).split('MK'))
                                                         .sort()
                                                         .map(function(x){return 'MK'+x;});
        }//fill mkId, txId for cellSet;
        for(var i in markSet){
            markSet[i].cellIds=[];
            markSet[i].length=0;
        }
        for(var i in txSet){
            txSet[i].cellIds=[];
        }
        for(var i in cellSet){
            temCell=cellSet[i];
            if (temCell.stat=='-') {
               continue;
            }            
            temCell.mkIds.forEach(function(item){
                markSet[item].cellIds.push(i);       //ignore 'CE'
                markSet[item].length+=item.length;
            });
            txSet[temCell.txId].cellIds.push(i);
            
            if (supSet['ST'+temCell.end]) {
                supSet['ST'+temCell.end].cellId=i;
            }
        }
        sortCellIdsInTxMk();
    };
    return {
        
        maxLnSize:maxLnSize,
        maxLn:maxLn,
        toString:function(){
            var temStr=[];
            temStr[0]='{sectionClass}\nmarkSet:';
            temStr.push(JSON.stringify(markSet));
            temStr.push('txSet:');
            temStr.push(JSON.stringify(txSet));
            temStr.push('cellSet:');
            temStr.push(JSON.stringify(cellSet));
            temStr.push('supSet:');
            temStr.push(JSON.stringify(supSet));
            return temStr.join('\n');
        },
        init:function(marks,txtEles){
            //[bLn,bCh,eLn,eCh,id], MKid TXid
            txSet={};
            markSet={};
            supSet={};
            txtEles.forEach(function(item){
                item.beg=item.bLn*maxLnSize+item.bCh;
                item.end=item.eLn*maxLnSize+item.eCh;
                txSet[item.id]=item;
            });
            marks=marks.map(function(aMark){
                return {
                        beg:aMark.bLn*maxLnSize+aMark.bCh,
                        end:aMark.eLn*maxLnSize+aMark.eCh,
                        id:aMark.id,
                        data:aMark.data
                        };
            });
            var filThing=filterDup(marks);
            
            marks.forEach(function(item){
                markSet[item.id]=item;
                supSet['ST'+item.end]=supSet['ST'+item.end]||{count:0,mkIds:[]};
                supSet['ST'+item.end].count++;
                supSet['ST'+item.end].mkIds.push(item.id);
            });
            
            borderList=[];
            cellSet={};          
            
            addInBorderList(filThing.noDup);
            addInBorderList(txtEles);
            genCellSet();
            fillMapInf(filThing.dup);
            //console.log(JSON.stringify(cellSet));
            //console.log('after init');
        },
        addMarks:function(markList){
            //[bLn,bCh,eLn,eCh,id], MKid TXid
             markList=markList.map(function(aMark){
                aMark.beg=aMark.beg||aMark.bLn*maxLnSize+aMark.bCh;
                aMark.end=aMark.end||aMark.eLn*maxLnSize+aMark.eCh;
                return {
                        beg:aMark.beg,
                        end:aMark.end,
                        id:aMark.id,
                        data:aMark.data
                        };
            });
            var filThing=filterDup(markList);
            
            markList.forEach(function(aMark){
                markSet[aMark.id]=aMark;
                if(!supSet['ST'+aMark.end]){
                    supSet['ST'+aMark.end]={count:0,mkIds:[]};
                }
                supSet['ST'+aMark.end].count++;
                supSet['ST'+aMark.end].mkIds.push(aMark.id);
            });
            
            updateCells(filThing.noDup, '+');
            filThing.dup.forEach(function(item){
                var temMark=markSet[item.sameAs];
                markSet[item.id].cellIds=temMark.cellIds;
                markSet[item.id].length=temMark.length;
            });
            
            return changeCells;
        },
        delAllMarks:function(){
            var txtEles=[];
            for(var i in txSet){
                txSet[i].cellIds=[];
                if (txSet[i].data) {
                    txSet[i].data=null;
                }
                txtEles.push(txSet[i]);
            }
            markSet={};
            cellSet={};
            supSet={};
            borderList=[];
            
            addInBorderList(txtEles);
            genCellSet();
        },
        delMarks:function(markList){
            markList.forEach(function(aMark){
                //delete markSet[aMark.id];
                if (!supSet['ST'+aMark.end]) {
                  console.log('warning: supSet.count==0');      
                }
                supSet['ST'+aMark.end]=supSet['ST'+aMark.end]||{count:0,mkIds:[]};
                supSet['ST'+aMark.end].count--;
                var temStr=supSet['ST'+aMark.end].mkIds.join(';');
                temStr=temStr.replace(aMark.id+';','');
                supSet['ST'+aMark.end].mkIds=temStr.split(';');
                if (supSet['ST'+aMark.end].count==0) {
                   delete supSet['ST'+aMark.end]     
                }
            });
            updateCells(markList,'-');
            markList.forEach(function(aMark){
                delete markSet[aMark.id];
            });
            return changeCells;
        },
        getSection:function(id){
           
           if (!id) {
            return false;
           }
           var cat=id.substr(0,2);
           var temSect={};
           if(cat=='CE'){
            temSect=cellSet[id];
           }else if (cat=='MK') {
            temSect=markSet[id];
           }else if (cat=='TX') {
            temSect=txSet[id];
           }else if (cat=='ST') {
            temSect=supSet[id];
           }
           if(!temSect){
                return false;
           }
           var o={};
           for(var i in temSect){
            o[i]=temSect[i];
           }
           if (cat!='ST') {
                o['bCh']=o.beg%maxLnSize;
                o['eCh']=o.end%maxLnSize;
                o['bLn']=parseInt(o.beg/maxLnSize);
                o['eLn']=parseInt(o.end/maxLnSize);
           }
           return o;
        },
        setSection:function(id,temObj){
           var cat=id.substr(0,2);
           if(cat=='CE'){
                for(var att in temOjb){
                    cellSet[id][att]=temOjb[att];
                }
           }else if (cat=='MK') {
                for(var att in temOjb){
                    markSet[id][att]=temOjb[att];
                }
           }else if (cat=='TX') {
                for(var att in temObj){
                    txSet[id][att]=temObj[att];
                }
           }
        },
        getCeByEnd:function(end){
            
        },
        get TXListWithCe(){     //含有CE的TX
            
            var idList=[];
            for(var id in txSet){
                if (txSet[id].cellIds.length>0) {
                    idList.push(id);
                }
            }
            return idList;
        },
        get AllTxIds(){
            return Object.keys(txSet);
        },
        get AllCellSet(){
            //return Object.assign({},cellSet);
            return assignObj({},cellSet)
        },
    };
}());
//paint mark, getSelection, create new mark
ARTICLE_MAK_natation.markViewer=(function moss(myTruffle){
    
    var aDomRange=document.createRange();
    var ceDomTag='em';       //surround cell by <em>
    var stDomTag='sup';     //supscript element
    
    function locateTxNodes(txId){
        var temPair=/([\w\d]+)-([\w\d]+)/.exec(txId);
        var parNode=document.getElementById(temPair[1]);
        if (!parNode) {
            return null;
        }
        var tOffset=parseInt(temPair[2]);
        var beg='',end='';
        var idStr='';
        var temNode=null;
        for(var i=0; i<parNode.childNodes.length; i++){
            temNode=parNode.childNodes[i];  
            if (temNode.nodeType==3) {
               idStr+='TX'+i+',';            
            }else if (temNode.id && temNode.id.match(/[CE|ST]\d+/)){
               idStr+=temNode.id+','
            }else{
               idStr+='OT'+i+',\/';
            }
        }
        var tArr=idStr.split(/\//);
        for(i=0; i<tArr.length;i++){
          end+=tArr[i];
          if (/TX|CE/.test(tArr[i])) {                      
             tOffset--;   
          }
          if (tOffset<0) {
             break   
          }
          beg+=tArr[i]
        }
        end=end.replace(/OT\d+,$/,'')//去除OT
        end=end.split(/,/).length-1
        beg=beg.split(/,/).length-1
        return [parNode,beg,end]
    };
    function locateTxId(parNode, txNode){
        
        if (!parNode.id || parNode.id.substr(0,2)!='TX') {
            return null;
        }
        var idStr='';
        var temNode;
        for(var i=0; i<parNode.childNodes.length; i++){
            temNode=parNode.childNodes[i];
            if (temNode==txNode) {
                idStr+='T'+i+','
                break;
            }
            if (temNode.nodeType==3) {
               idStr+='T'+i+','
            }else if(temNode.id){
                idStr+=temNode.id+','
            }else{
                idStr+='#'+i+','        
            }
        }
        //fix 数第几个TX的BUG by meng 2018-4-8
        //找最后一个CE辅助定位
        var xPos=idStr.lastIndexOf('CE')
        var xPos2,tCEId,temCE;
        var tCount=-1
        //有CE情况
        if (xPos>=0) {
            xPos2=idStr.indexOf(',',xPos)//code
            tCEId=idStr.substr(xPos,xPos2-xPos)
            temCE=myTruffle.getSection(tCEId)
            tCount=temCE.txId.substr(temCE.txId.indexOf('-')+1)
            tCount=parseInt(tCount)
            idStr=idStr.substr(xPos2+1).replace(/^ST\d+,/,'')
            idStr=idStr.replace(/^T\d+,/,'')
        }
        //最终的TX数量
        while(/T\d+,/.test(idStr)){
            tCount++
            idStr=idStr.replace(/T\d+,/,'')
        }
        var temRet=parNode.id+'-'+tCount
        return temRet
    };
    function getRangeByWord(aWord){
        var txIds=myTruffle.AllTxIds;
        
        var preList=[];
        var offset=0,
            begCh=0;
        var preStr='',
            curMat='';
        var temLen=0;
        var temTx={};
        
        var found=txIds.some(function(txId){
            
           temTx=myTruffle.getSection(txId);
           if (!temTx.data ||temTx.data.length==0) {
              temTx.data=setTxData(txId);
           }
           curMat=preStr+temTx.data;
           preList.push({id:txId,length:temTx.data.length});
           if (curMat.indexOf(aWord)!=-1) {
                return true;
           }
           preStr=curMat.substr(curMat.length-aWord.length+1);
           var tl=preStr.length;
           temLen=0;
           for(var i=preList.length-1; i>=offset; i--){
              temLen+=preList[i].length;
              if (temLen>=preStr.length) {
                begCh=temLen-preStr.length;
                break;
              }
           }
           offset=i;
           return false;    
        });
        if (!found) {
           return null;
        }
        var anchorTxId=-1;
        var anchorCh=curMat.indexOf(aWord);
        var focusTxId=preList[preList.length-1].id;
        var focusCh=preList[preList.length-1].length-(curMat.length-anchorCh-aWord.length);
        found=false;
        anchorCh+=begCh;
        for(; offset<preList.length; offset++){
            
           if(preList[offset].length>anchorCh){
                anchorTxId=preList[offset].id;
                found=true;
                break;
           }else{
                anchorCh-=preList[offset].length;
           }
        };
        if (!found) {
           return null;     
        }
        
        return {'anchorTxId':anchorTxId, 'anchorCh':anchorCh, 'focusTxId':focusTxId, 'focusCh':focusCh};
        
    };
    function setTxData(txId){
        var tArr=locateTxNodes(txId);   //parNode,beg, end
        if (!tArr){
           return '';
        }
        console.assert(tArr[1]==tArr[2]-1,'no single txNode in setTxData')
        myTruffle.setSection(txId,{'data':tArr[0].childNodes[tArr[1]].data});
        return tArr[0].childNodes[tArr[1]].data;
    };
    function paintOneTx(txId){
        
        var temTx=myTruffle.getSection(txId);
        if (!temTx.cellIds || temTx.cellIds.length<1) {
            return;
        }
        var tArr=locateTxNodes(txId);
        if (!tArr){
           return ;
        }
        var parNode=tArr[0],
            txNode=parNode.childNodes[tArr[1]]
        if (!temTx.data ||temTx.data.length==0) {
            myTruffle.setSection(txId,{'data':txNode.data});
            temTx.data=txNode.data;
        }
        var isLastNode=false   
        if(tArr[2]==parNode.childNodes.length){
           isLastNode=true;
           txNode=null; //插入位置
        }else{
           txNode=parNode.childNodes[tArr[2]] //插入位置
        }
        
        var oriStr=temTx.data;
        var newList=[];
        var temCell={};
        var offCh=0;
        temTx.cellIds.forEach(function(ceIndx){
            
            temCell=myTruffle.getSection(ceIndx);
            temCell.bCh-=temTx.bCh;
            temCell.eCh-=temTx.bCh;
            if (temCell.bCh>offCh) {
                newList.push(oriStr.substr(offCh,temCell.bCh-offCh));
            }            
            newList.push({type:'CE',id:ceIndx,data:oriStr.substr(temCell.bCh,temCell.eCh-temCell.bCh)});
            offCh=temCell.eCh;
        });
       
        if (offCh<oriStr.length) {
            newList.push(oriStr.substr(offCh));
        }
        var docfrag = document.createDocumentFragment();
        var txNode1=null,
            ceNode=null;
        newList.forEach(function(item){
            if (item.type) {
                ceNode=document.createElement(ceDomTag);
                ceNode.innerHTML=item.data;
	        ceNode.className = "annotation"
                ceNode.id=item.id;
                docfrag.appendChild(ceNode);
            }else{
                txNode1=document.createTextNode(item);
                docfrag.appendChild(txNode1);
            }
        });
        //实际是插到删除区域的后面
        parNode.insertBefore(docfrag,txNode);
        aDomRange.setStart(parNode,tArr[1]);
        aDomRange.setEnd(parNode,tArr[2]);
        
        aDomRange.deleteContents();
        
        //paint sup element
        var temDomEle=null,
            temSupEle=null;
        var temSup=null;
        temTx.cellIds.forEach(function(ceIndx){
            temCell=myTruffle.getSection(ceIndx);
            paintSup(temCell.end);
        });   
    };
    function paintSup(end){
        
        var temSup=myTruffle.getSection('ST'+end);
        if(!temSup){
            return;
        }
        var temDomEle=document.getElementById('ST'+end);
        if (temDomEle){
            temDomEle.innerHTML='['+temSup.count+']';
        }else{
            
            temDomEle=document.getElementById(temSup.cellId);
            var temSupEle=document.createElement(stDomTag);
            temSupEle.id='ST'+end;
            temSupEle.className='noselect fa fa-pencil';
            // temSupEle.innerHTML='['+temSup.count+']';
            // temSupEle.innerHTML='<i class="fa fa-pencil"></i>';
            $(temSupEle).insertAfter(temDomEle);
        }  
    };
    function clearOneTx(txId){
        var temTx=myTruffle.getSection(txId);
        if (!temTx.data) {
            return;
        }
        var tArr=locateTxNodes(txId);
        if (!tArr) {
           return;
        }    
        var parNode=tArr[0];
        var txNode=parNode.childNodes[tArr[2]]
        var isLastNode=false;
        if (parNode.childNodes.length==tArr[2]) {
            isLastNode=true;    
            txNode=null;
        }
        parNode.insertBefore(document.createTextNode(temTx.data),txNode);
        
        aDomRange.setStart(parNode,tArr[1]);
        aDomRange.setEnd(parNode,tArr[2]);
        aDomRange.deleteContents();
        
    };
    return {
 
        locateTxId:function(parNode, txNode){
            return locateTxId(parNode,txNode);
        },
        getWRange:function(aWord){
            if (!aWord) {
                return null;
            }
            var wRange=getRangeByWord(aWord);  //{'anchorTxId':anchorTxId, 'anchorCh':anchorCh, 'focusTxId':focusTxId, 'focusCh':focusCh};
            if (!wRange) {
                return null;
            }
            var temMark={};
            var anchorTx=myTruffle.getSection(wRange.anchorTxId);
            var focusTx=myTruffle.getSection(wRange.focusTxId);
            temMark.bLn=anchorTx.bLn;
            temMark.bCh=anchorTx.bCh+wRange.anchorCh;
            temMark.eLn=focusTx.bLn;
            temMark.eCh=focusTx.bCh+wRange.focusCh;
            temMark.data=aWord;
            return temMark;            
        },
        paintTxList:function(txIdList){
            txIdList.forEach(function(txId){
                paintOneTx(txId);
            });
            
        },
        clearTxList:function(txIdList){   
           txIdList.forEach(function(indx){
                clearOneTx(indx);
           });
        }
    }
}(ARTICLE_MAK_natation.mixedSections));

ARTICLE_MAK_natation.controller=(function banyan(myTruffle,myMoss){

    var ctr_rootEle=null;
    
    function nextTxNode(curNode){
        
       var iterator = document.createNodeIterator(ctr_rootEle,NodeFilter.SHOW_TEXT,
						   /*{ acceptNode: */function(node){							
                                                                if ( !node.nodeValue || node.nodeValue=='\n'){
                                                                        return NodeFilter.FILTER_SKIP;
                                                                }
                                                                else{
                                                                        return NodeFilter.FILTER_ACCEPT;
                                                                }
                                                        }				
						   /*}*/,false);
       var txNode;
       while (txNode= iterator.nextNode()){
          if(txNode==curNode){
            break;
          }
       }
       if (!txNode) {
         return null
       }else{
         return iterator.nextNode();
       }
    };
    function calPosition(aRange,typ){       //NOTE: it is Range object, not selection object
       
       var temObj={};   //{ln,ch}
       var parNode=null,
           curNode=null;
           
       var offset=0;
       if(typ=='BEG'){
            curNode=aRange.startContainer ;
            offset=aRange.startOffset;
            //处理边界
            if (curNode.length<=offset) {
                curNode=nextTxNode(curNode)
                offset=0
                parNode=curNode.parentNode;
            }
       }
       if(typ=='END'){
            curNode=aRange.endContainer ;
            offset=aRange.endOffset;
       }
       parNode=curNode.parentNode;
       console.assert(parNode,'parentNode is null, err in calPosition')
       //不考虑offset
       if (parNode.id && parNode.id.substr(0,2)=='ST'){
          //console.assert(false,'in suptail, err in calPosition')
          
          temObj.beg=parseInt(parNode.id.substr(2));
          temObj.ln=parseInt(temObj.beg/myTruffle.maxLnSize);
          temObj.ch=temObj.beg%myTruffle.maxLnSize;
          return temObj;
       }
       if (parNode.id && parNode.id.substr(0,2)=='CE') {
          var temCe=myTruffle.getSection(parNode.id);
          if (!temCe ||temCe.length<offset) {
            console.log('No.8: wrong in calPosition');
            alert('出错了:-]，请重新编辑并提交文章试试！')
            return false;
          }
          temObj.ln=temCe.bLn;
          temObj.ch=temCe.bCh+offset;
          
          return temObj;
       }
       var temPreNode=curNode.previousSibling;
       //only ST, impossible CE
       if ( temPreNode && temPreNode.id && temPreNode.id.substr(0,2)=='ST'){
            temObj.beg=parseInt(temPreNode.id.substr(2));
            temObj.ln=parseInt(temObj.beg/myTruffle.maxLnSize);
            temObj.ch=temObj.beg%myTruffle.maxLnSize+offset;
            return temObj; 
       }
       var temTx=myTruffle.getSection(myMoss.locateTxId(parNode,curNode));
       if (!temTx) {
            console.log('No.8: wrong in calPosition');
            alert('出错了:-]，请重新编辑并提交文章试试！')
            return false;
        }
       temObj.ln=temTx.bLn;
       temObj.ch=temTx.bCh+offset;         
        
       return temObj;
    };
    function getTxListByPage(curEntrance){
      //如果PAGE里已经写入标记TX元素的ID， 则不用PSEUO， 需写一个PARSE PAGE的函数
      //如果给的是string， 表示给的存放tx元素的id, 给root表示没有tx元素信息
      if (curEntrance =='TXNODES_ARRAY' ) {
        return parseGetTx(curEntrance)
      }else{
        return pseudoGetTx();
      }
    };
    function parseGetTx(txEntrance){
       var txList=[]
       txList=JSON.parse($('#'+txEntrance).html()).map(function(item){
                                        var temObj=JSON.parse(item)
                                        return {  bLn:temObj.ln, eLn:temObj.ln,
                                                  bCh:temObj.ch,eCh:temObj.ch+temObj.length,
                                                  id:temObj.id
                                                }
                                 })
       
       return txList;
    };
    function pseudoGetTx(){
       if (!ctr_rootEle) {
            return []
       }
       var iterator = document.createNodeIterator(ctr_rootEle,NodeFilter.SHOW_TEXT,
						   /*{ acceptNode: */function(node){							
                                                                if ( !node.nodeValue || node.nodeValue=='\n'){
                                                                        return NodeFilter.FILTER_SKIP;
                                                                }
                                                                else{
                                                                        return NodeFilter.FILTER_ACCEPT;
                                                                }
                                                        }				
						   /*}*/,false);
       var txList=[];
       var txNode;
       var Ln=0,
           bCh=0;
       var parNode=null;
       /*
       txCount=$(parNode).attr('txCount')
			//存在改变MDEDIT已有的ID的情况  161019 BY MENG
			if (typeof txCount =='undefined') {
			   parNode.id='TX'+temId++;
			   $(parNode).attr('txCount',1)
			   txCount=0//code
			}else{
			   $(parNode).attr('txCount',parseInt(txCount)+1) 
			}
       */
       var temId=0,txCount=0;
       
       while (txNode= iterator.nextNode()){
        
        var temTx={bLn:Ln,bCh:0,eLn:Ln};
        Ln++
        
        parNode=txNode.parentNode;
        txCount=$(parNode).attr('txCount')
        if (typeof txCount =='undefined') {
            parNode.id='TX'+temId++;
            $(parNode).attr('txCount',1)
            txCount=0//code
        }else{
            $(parNode).attr('txCount',parseInt(txCount)+1) 
        }
        //txNode.id=parNode.id+'-'+parNode.txCount;
        temTx.eCh=bCh+txNode.data.length;
        temTx.data=txNode.data
        temTx.id=parNode.id+'-'+txCount;
        txList.push(temTx);
       }
       return txList;
    };
    function assertTxNodes(rootEle,txList){
       
       var parSet={},
           parSet1={};
       var parId=''
       txList.forEach(function(item){
          parId=item.id.replace(/-\S+/,'')
          parSet[parId]?parSet[parId]++:parSet[parId]=1
        })
       var iterator = document.createNodeIterator(rootEle,NodeFilter.SHOW_TEXT,
						   /*{ acceptNode: */function(node){							
                                                                if ( !node.nodeValue || node.nodeValue=='\n'){
                                                                        return NodeFilter.FILTER_SKIP;
                                                                }
                                                                else{
                                                                        return NodeFilter.FILTER_ACCEPT;
                                                                }
                                                        }				
						   /*}*/,false);
       var txNode;
       var parNode=null;
       var txCount=0;
       while (txNode= iterator.nextNode()){
        parNode=txNode.parentNode;
        txCount=$(parNode).attr('txCount')
        console.assert(parSet[parNode.id],"no parent of txNode"+parNode.id)
        console.assert(parSet[parNode.id]==txCount,"txCount not equal")
        if (parSet[parNode.id]!=txCount || !parSet[parNode.id]) {
            alert('出错了，请重新编辑并提交文章试试！',6000)//code
            break
        }
        parSet1[parNode.id]?parSet1[parNode.id]++:parSet1[parNode.id]=1
       }
       for (var id in parSet1) {
        console.assert(parSet1[id]==parSet[id],"txCount no equal")
       }
    };
    return{
      
      init:function(rootEle){
        ctr_rootEle=rootEle
        
        var markList=[];//httpGetMarkList();
        var txList=[]
        
        txList=getTxListByPage(rootEle)
        //$(rootEle).attr('txCount',txList.length)
        
        assertTxNodes(rootEle,txList)
        
        myTruffle.init(markList,txList);
        
      },
      createMarks:function(markList){
        
        var changeCells=myTruffle.addMarks(markList);
        var chaTxIds={},
            delTxIds={};
        var temCell;
        changeCells.forEach(function(item){
           temCell=myTruffle.getSection(item.id);
           //if (item.stat=='-') {
           //  delTxIds[temCell.txId]?delTxIds[temCell.txId]+=item.id+';':delTxIds[temCell.txId]=item.id+';';   
           //}
           if (item.stat=='+') {
             chaTxIds[temCell.txId]?chaTxIds[temCell.txId]+=item.id+';':chaTxIds[temCell.txId]=item.id+';';   
           }
        });
        //myMoss.clearTxList(Object.keys(delTxIds))
        myMoss.paintTxList(Object.keys(chaTxIds));        
      },
      delMarks:function(mkList){
        var changeCells=myTruffle.delMarks(mkList);
        //here, we try the set, it is new data-struct supported by ES6
        var chaSet=new Set(),
            delSet=new Set();
        
        var temCell;
        changeCells.forEach(function(item){
           temCell=myTruffle.getSection(item.id);
           if (item.stat=='-') {
             delSet.add(temCell.txId);
           }
           chaSet.add(temCell.txId);
        });
        //update by Meng 解决IE 不去持 Array.from 集合变数组问题
        //update 170421 by Meng
        var tArray=[]
        delSet.forEach(function(item){tArray.push(item)});        
        myMoss.clearTxList(tArray)
        tArray=[]
        chaSet.forEach(function(item){tArray.push(item)})
        myMoss.paintTxList(tArray);  
      },
      getNodesInRange:function(mRange){
        //return goRightMeetU(aRange)
        var voyage=[];
        var bNode=mRange.startContainer;
        var eNode=mRange.endContainer;
        while(bNode!=eNode){
          if (bNode.nodeType==3) {
              voyage.push(bNode);
          }else if (bNode.hasChildNodes()) {
              bNode=bNode.firstChild;
              continue;
          }
          while(!bNode.nextSibling){
            bNode=bNode.parentNode;
            if (bNode==mRange.commonAncestorContainer) {
              break;
            }
          }
          if (bNode==mRange.commonAncestorContainer) {
              break;
          }
          bNode=bNode.nextSibling;
        }
        voyage.push(eNode);
        return voyage;
      },
      triggerSelect:function(aSelection){
        //converse the selection to range object, here, we assume only one range in a selection
        //range object can change the direction from left to right, if the current dirction is right to left
        var mRange=aSelection.getRangeAt(0);
        
        var temMark={};
        var temObj=calPosition(mRange,'BEG');
        if (!temObj) {
            return null;
        }
        temMark.bLn=temObj.ln;
        temMark.bCh=temObj.ch;
        
        temObj=calPosition(mRange,'END');
        if (!temObj) {
            return null;
        }
        temMark.eLn=temObj.ln;
        temMark.eCh=temObj.ch;
        
        //处理选择时的前后空格, update by Meng 18-3-25
        var tRangeStr=mRange.toString()
        //处理选择了注释后缀的情况，目前办法不完全正确, 如果内容本身为[\d+] 情况，则不对
        tRangeStr=tRangeStr.replace(/\[\d+\]/g,'')
        if (tRangeStr.charAt(0)==' ') {
            temMark.bCh++//code
        }
        if (tRangeStr.charAt(tRangeStr.length-1)==' ' && temMark.eCh>0) {
            temMark.eCh--//code
        }
        tRangeStr=tRangeStr.trim()       
        temMark.content=tRangeStr//*mRange.toString()*/.replace(/\[\d+\]/g,'');
        return temMark;
      },
      triggerAword:function(aWord){
        
        return myMoss.getWRange(aWord);
      }     
    }   
}(ARTICLE_MAK_natation.mixedSections,ARTICLE_MAK_natation.markViewer));
