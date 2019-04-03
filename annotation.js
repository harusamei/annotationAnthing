// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';




// $(document).click(function(){
//
//     var sel = window.getSelection();
//
//     console.log(sel.toString());
//
//     var range = sel.getRangeAt(0);
//
//     // var divElement = $("<div></div>");
//     // divElement.append( range.extractContents() );
//     // console.log( divElement.html() );
//
//     range.collapse(false);
//
//     //$("<div>haha</div>").get()
//
//     var newNode = document.createElement("p");
//     newNode.appendChild(document.createTextNode("New Node Inserted Here"));
//
//     range.insertNode( newNode );
//
//     console.log(range.collapsed);
//
//     console.log(sel.toString());
//
// });

(function AnnotationAnything(){

    var gDlgElem = null;
    var gTextSelectionList = new Array();

    function TextSelection(startNode, startOffset,endNode, endOffset){

        this.startNode   = startNode;
        this.startOffset = startOffset;

        this.endNode   = endNode;
        this.endOffset = endOffset;

        this.replaceNode = null;
        this.jClickNodeList = null;


    }

    //保存成string
    TextSelection.prototype.toStoreString = function(){

    };

    //从保存的string中恢复出来
    TextSelection.prototype.fromStoreString = function(){

    };

    TextSelection.prototype.setStart=function(startNode, startOffset){
        this.startNode = startNode;
        this.startOffset = startOffset;
    };

    TextSelection.prototype.setEnd = function(endNode, endOffset){
        this.endNode   = endNode;
        this.endOffset = endOffset;
    };



    function TraverseTree( startNode, endNode ){
        this.startNode = startNode;
        this.endNode = endNode;
        this.nodeList = new Array();
        this.record = false;
        this.traverse(document.body);
    };

    TraverseTree.prototype.getNodeList = function(){
        return this.nodeList;
    };

    TraverseTree.prototype.traverse = function(node){
        console.log("Traversing "+node);
        if( node === this.startNode ){
            this.record = true;
        }
        if( this.record ){
            this.nodeList.push( node );
        }
        if( node === this.endNode ){
            return false;
        }
        var children = $(node).contents();
        for(  var i=0; i<children.length; i++ ){
            if( !this.traverse(children.get(i)) ){
                return false;
            }
        }
        return true;

    };




    $(document).click(function(){
        console.log("onClick document.body");
        showDlg();
    });


    function showDlg(){

        var sel = window.getSelection();
        if( sel.rangeCount <= 0 ){
            return;
        }
        var range = sel.getRangeAt(0);
        var annotationText = range.toString();
        if( annotationText=="" ){
            return;
        }

        dismissDlg();

        if( range.startContainer.nodeType == Node.TEXT_NODE && range.endContainer.nodeType == Node.TEXT_NODE ){
        }else{
            console.log("not text node");
            return;
        }


        gDlgElem =  $(getHtmlDlg());
        $("body").append( gDlgElem );

        $("#__popup_annotation_dlg_title").text(annotationText);

        $("#__popup_annotation_dlg_OK").click(function(e){

            processSelection(range);

            //clear selection
            //https://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
            window.getSelection().empty();

            dismissDlg();

            e.stopPropagation();
        });
    }

    function processSelection( range ) {

        var replaceText = $("#__popup_annotation_dlg_content").val();
        if (replaceText == "") {
            alert("Content is empty");
            return;
        }


        var ts = new TextSelection(range.startContainer, range.startOffset, range.endContainer, range.endOffset);


        //获取所有节点，然后replace with 自己的节点
        var traverse = new TraverseTree(range.startContainer, range.endContainer);
        var nodeList = traverse.getNodeList();

        // for( var i=0; i<nodeList.length; i++ ){
        //     console.log(i+": "+nodeList[i]);
        // }


        //实行替换策略
        var jStartNode = $(ts.startNode);
        var jEndNode = $(ts.endNode);


        //更改dom结构
        var jStartSplitNode = null;
        var jEndSplitNode = null;

        if (ts.startNode === ts.endNode) {
            var jStartSplitNode = $("<span></span>");
            var text = jStartNode.text();
            jStartSplitNode.text(  text.substr(ts.startOffset, ts.endOffset-ts.startOffset ) );
            ts.startNode.nodeValue = text.substr(0, ts.startOffset);
            var jRemainNode = $(  document.createTextNode(text.substr( ts.endOffset)) );
            jStartNode.after(jStartSplitNode);
            jStartSplitNode.after(jRemainNode);

        } else {
            var jStartSplitNode = $("<span></span>");
            var jEndSplitNode = $("<span></span>");
            {
                var startText = jStartNode.text();
                jStartSplitNode.text(startText.substr(ts.startOffset));
                // console.log("Before:"+ts.startNode.nodeValue);
                ts.startNode.nodeValue = startText.substr(0, ts.startOffset);
                // console.log("After:"+ts.startNode.nodeValue);
                jStartNode.after(jStartSplitNode);
            }
            {
                var endText = jEndNode.text();
                jEndSplitNode.text(endText.substr(0, ts.endOffset));
                ts.endNode.nodeValue = endText.substr(ts.endOffset);
                jEndNode.before(jEndSplitNode);
            }
        }

        var jReplaceNode = $("<span style='background-color:yellow'></span>");
        jReplaceNode.text(replaceText);
        jReplaceNode.hide();

        ts.replaceNode = jReplaceNode.get();

        jStartSplitNode.before(jReplaceNode);

        var clickNodeList = new Array();
        clickNodeList.push(jStartSplitNode);
        if( jEndSplitNode != null ){
            clickNodeList.push(jEndSplitNode);
        }
        for( var i=0; i<nodeList.length; i++ ){
            if( nodeList[i].nodeType == Node.TEXT_NODE ){
                var parent = nodeList[i].parentNode;
                var found = false;
                for( var j=0; j<clickNodeList.length; j++ ){
                    if( clickNodeList[j].get() === parent ){
                        found = true;
                        break;
                    }
                }
                if( found ){
                    clickNodeList.push($(parent));
                }
            }
        }


        ts.jClickNodeList = clickNodeList;

        for( var i=0; i<clickNodeList.length; i++ ){
            clickNodeList[i].css("background-color","red");
            clickNodeList[i].click(function(){
                jReplaceNode.show();
                for( var j=0; j<ts.jClickNodeList.length; j++ ){
                    ts.jClickNodeList[j].hide();
                }
            });
        }

        jReplaceNode.click(function(){
            jReplaceNode.hide();
            for( var j=0; j<ts.jClickNodeList.length; j++ ){
                ts.jClickNodeList[j].show();
            }
        });


    }


    function dismissDlg(){
        if( gDlgElem!=null ){
            gDlgElem.remove();
            gDlgElem = null;
        }
    };

    function getHtmlDlg(){
        var sb =
            "<div id=\"__popup_annotation_dlg\" style=\"position: absolute;\n" +
            "            background-color: #3f6bb8;\n" +
            "            min-width: 100px;\n" +
            "            top: 50%;\n" +
            "            left: 50%;\n" +
            "            -webkit-transform: translate(-50%, -50%);\n" +
            "            -moz-transform: translate(-50%, -50%);\n" +
            "            -ms-transform: translate(-50%, -50%);\n" +
            "            -o-transform: translate(-50%, -50%);\n" +
            "            transform: translate(-50%, -50%); \">\n" +
            "\n" +
            "    <p id=\"__popup_annotation_dlg_title\">test</p>\n" +
            "    <p><textarea  id=\"__popup_annotation_dlg_content\">测试文本</textarea></p>\n" +
            "\n" +
            "    <p><input value=\"OK\" type=\"button\" id=\"__popup_annotation_dlg_OK\"></p>\n" +
            "\n" +
            "\n" +
            "</div>";

        return sb;
    };

})();





