function Portrait(options) {
    var opts = $.extend({
    }, options);
    this.canvas = opts.canvas;
    this.input = opts.input;
    this.submit = opts.submit;
    this.reset = opts.reset;
    this.imgContainer = opts.imgContainer;
    this.isDiy = opts.isDiy;
    this.initialImgObj = {
        initialWidth: 0,
        initialHeight: 0,
        changedWidth: 0, //变换后图片宽度
        changedHeight: 0, //变换后图片高度
        changedX0: 0, //变换后图片左上角横坐标
        changedY0: 0,  //变换后图片左上角纵坐标
        scale: 0
    }
    this.moveObj = {
        dragBool: false, 
        strechBool: false,
        mouseXStart: 0,
        mouseYStart:0, 
        mouseXDistance: 0,
        mouseYDistance:0,
        width: 0,
        height: 0,
        picLeft: 0,
        picTop: 0,
        minWidth: 10,
        minHeight: 10,
        WHRatio: 1,
        initialWidth: 80,
        initialHeight:80,
        imgObj: "",
        lastImgUrl: "",
        lastImgWidth: "",
        lastImgHeight: ""
    }
}

Portrait.prototype = {
    constructor: Portrait,
    trigger: function(){
        var _this = this;
        $("<link>").attr({ 
            rel: "stylesheet",
            type: "text/css",
            href: "./style.css"
        }).appendTo("head");
        
        _this.initHTML();
        _this.setHtmlStyle();
        _this.initEvent();
    },
    initHTML: function() {
        var _this = this;
        var html = [];
        var input = [];
        var container = [];
        var canvas = [];
        var buttonSubmit = [];
        var buttonReset = [];
        var diy = [];

        //头部的input部分
        input.push("<input type='text' name='img-name' readonly='readonly' >");
        input.push("<input type='file' name='select-pic' value='file' accept='image/jpeg,image/jpg,image/png'>");
        _this.input.inputNode.html(input.join(''));

        //右边canvas部分
        canvas.push("<div class='small-pic-container'>");
        canvas.push("<canvas class='small-pic'></canvas>");
        canvas.push("<div class='pixel'></div>");
        canvas.push("</div>");
        _this.canvas.canvasNode.html(canvas.join(''));

        //左边图片容器部分
        container.push("<div class='img-container-outer'>");
        container.push("<img class='img-container-outer-back'>");
        container.push("<div class='img-container-inner'>");
        container.push("<div class='drag-icon'></div>");
        container.push("<div class='img-container'>");
        container.push("<img>");
        container.push("</div>");
        container.push("</div>");
        container.push("</div>");
        _this.imgContainer.containerNode.html(container.join(''));

        //底部按钮部分
        buttonSubmit.push("<div class='submit'></div>");
        if (_this.submit.isNeed) {
            _this.submit.submitNode.html(buttonSubmit.join(''));
        }
        buttonReset.push("<div class='reset'></div>");
        if (_this.reset.isNeed) {
            _this.reset.resetNode.html(buttonReset.join(''));
        }

        //自定义头像宽高部分
        diy.push("<div class='diy-portrait'>");
        diy.push('<label></label>');
        diy.push("<input type='text' name='portrait-width'>");
        diy.push("<label></label>");
        diy.push("<input type='text' name='portrait-height'>");
        diy.push("<span></span>");
        diy.push("</div>");
        if (_this.isDiy.isNeed) {
            _this.isDiy.diyNode.html(diy.join(''));
        }
    },
    setHtmlStyle: function() {
        var _this = this;

        //左边容器初始化
        var imgContainer = $('.img-container-outer');
        imgContainer.css({
            width: _this.imgContainer.width,
            height: _this.imgContainer.height
        }).children('img').eq(0).attr({
            src: _this.imgContainer.unloadImgUrl
        })

        imgContainer.children('.img-container').children('img').attr({
            src: _this.imgContainer.unloadImgUrl
        })

        //右边canvas容器
        var smallPicContainer = $('.small-pic-container');
        smallPicContainer.css({
            paddingLeft: _this.imgContainer.width + 20
        })
        var canvas = $('.small-pic').get(0);
        canvas.width = _this.canvas.width;
        canvas.height = _this.canvas.height;

        //配置diy  canvas部分
        if (_this.isDiy.isNeed) {
            var diyPortrait =  $('.diy-portrait');
            diyPortrait.children('label').eq(0).html('宽度：');
            diyPortrait.children('label').eq(1).html('高度：');
            diyPortrait.children('span').html('自定义头像宽高');
        }

        //配置重置、提交按钮
        if (_this.submit.isNeed) {
            var submit = $('.submit');
            submit.html('提交');
        }

        if (_this.reset.isNeed) {
            var reset = $('.reset');
            reset.html('取消');
        }
    },
    initEvent: function() {
        var _this = this;
        _this.inputStateChange(); //为input绑定change 事件

        if (_this.isDiy.isNeed) {
            _this.diyWidthAndHeight();  //有自定义宽高的时候，绑定自定义宽高的事件
        }

        if (_this.reset.isNeed) {
            $('.reset').on('click', _this.resetFunc.bind(_this));
        }

        if (_this.submit.isNeed) {
            $('.submit').on('click', _this.submitResult.bind(this));
        }
    },
    inputStateChange: function(callback) {
        var _this = this;
        var input = $("input[name='select-pic']");
        var inputForImageName = $("input[name='img-name']");
        var imageURL;
        input.change(function(event){
            event = event ? event : window.event;
            if (input.get(0).files[0] && window.URL) {
                inputForImageName.val(input.get(0).files[0].name);
                imageURL = window.URL.createObjectURL(input.get(0).files[0]);
            } else {
                imageURL = input.get(0).value;
            }
            $('.img-container-inner').show();
            if (_this.submit.isNeed && _this.reset.isNeed) {
                $('.submit').show();
                $('.reset').show();
            }
            var $imgContainerOuter = $('.img-container-outer');
            var $imgContainerOuterBack = $('.img-container-outer').children('img').eq(0);

            var $imgContainer = $('.img-container-inner');
            var $img = $('.img-container').children('img');
            var IMG = new Image();
            IMG.onload = function() {
                _this.initialImgObj.initialWidth = IMG.width;
                _this.initialImgObj.initialHeight = IMG.height;
                var scale = (_this.initialImgObj.initialWidth / $imgContainerOuter.width()) <= (_this.initialImgObj.initialHeight / $imgContainerOuter.height()) ? _this.initialImgObj.initialHeight / $imgContainerOuter.height() : _this.initialImgObj.initialWidth / $imgContainerOuter.width();
                $img.attr({
                    src: imageURL
                })
                $img.css({
                    width: _this.initialImgObj.initialWidth / scale,
                    height: _this.initialImgObj.initialHeight / scale,
                    left: 0,
                    top: 0
                })
                $imgContainerOuterBack.attr({
                    src: imageURL
                })
                $imgContainerOuterBack.css({
                    width: _this.initialImgObj.initialWidth / scale,
                    height: _this.initialImgObj.initialHeight / scale,
                    left: _this.initialImgObj.initialWidth / scale == $imgContainerOuter.width() ? 0 : (_this.initialImgObj.initialHeight / scale - _this.initialImgObj.initialWidth / scale) / 2,
                    top: _this.initialImgObj.initialWidth / scale == $imgContainerOuter.width() ? (_this.initialImgObj.initialWidth / scale - _this.initialImgObj.initialHeight / scale) / 2 : 0,
                })
                $imgContainer.css({
                    width: _this.initialImgObj.initialWidth / scale,
                    height: _this.initialImgObj.initialHeight / scale,
                    left: _this.initialImgObj.initialWidth / scale == $imgContainerOuter.width() ? 0 : (_this.initialImgObj.initialHeight / scale - _this.initialImgObj.initialWidth / scale) / 2,
                    top: _this.initialImgObj.initialWidth / scale == $imgContainerOuter.width() ? (_this.initialImgObj.initialWidth / scale - _this.initialImgObj.initialHeight / scale) / 2 : 0,
                })
                //变换后的图片对象信息
                _this.initialImgObj.changedWidth = _this.initialImgObj.initialWidth / scale;
                _this.initialImgObj.changedHeight = _this.initialImgObj.initialHeight / scale;
                _this.initialImgObj.changedX0 = parseFloat($img.css('left'));
                _this.initialImgObj.changedY0 = parseFloat($img.css('top'));
                _this.initialImgObj.scale = scale;

                //渲染拖动框
                _this.moveObj.width = _this.moveObj.initialWidth;
                _this.moveObj.height = _this.moveObj.initialWidth / _this.moveObj.WHRatio;
                _this.moveObj.picLeft = 0;
                _this.moveObj.picTop = 0;

                if (_this.isDiy.isNeed) {
                    $("input[name='portrait-width']").val("");  //重置input宽高输入框
                    $("input[name='portrait-height']").val("");
                }
                

                $('.img-container').css({
                    width: _this.moveObj.width,
                    height:  _this.moveObj.height,
                })

                //设置拖拽小方块儿的样式
                $('.img-container-inner .drag-icon').css({
                    left: _this.moveObj.picLeft + _this.moveObj.width - 15,
                    top: _this.moveObj.picTop + _this.moveObj.height - 15
                });
                _this.moveObj.imgObj = IMG;

                _this.stretchPic(_this.moveObj.width, _this.moveObj.height);
                _this.movePic(_this.moveObj.picLeft, _this.moveObj.picTop);
                _this.moveFuncBind(); //绑定mouse相关事件
            }
            IMG.src = imageURL;
        })
    },
    movePic: function(left, top) {
        var _this = this;
        var $dragIcon = $('.img-container-inner .drag-icon');
        var $movePicContainer = $('.img-container');
        var $movePic = $('.img-container img');
        $movePicContainer.css({
            left: left,
            top: top
        })
        $dragIcon.css({
            left : left + _this.moveObj.width - 15,
            top: top + _this.moveObj.height -15
        })
        $movePic.css({
            left: -left,
            top: -top
        })
        _this.canvasToImge(left, top, _this.moveObj.width, _this.moveObj.height);
    
    },
    stretchPic: function(width, height) {
        var _this = this;
        var $movePicContainer = $('.img-container');
        var $dragIcon = $('.img-container-inner .drag-icon');
        $movePicContainer.css({
            width: width,
            height: height
        })
        $dragIcon.css({
            left : _this.moveObj.picLeft + width - 15,
            top: _this.moveObj.picTop + height - 15
        })
        _this.canvasToImge(_this.moveObj.picLeft, _this.moveObj.picTop, width, height);
    },
    moveFuncBind: function() {
        var _this = this;
        $(document.body).on('mousedown', _this.mousedownFunc.bind(_this));
        $(document.body).on('mousemove', _this.mousemoveFunc.bind(_this));
        $(document.body).on('mouseup', _this.mouseupFunc.bind(_this));
    },
    mousedownFunc: function() {
        var _this = this;
        _this.moveObj.mouseXStart = event.clientX;
        _this.moveObj.mouseYStart = event.clientY;
        var leftBoundary = event.clientX - $('.img-container-outer').offset().left - parseFloat($('.img-container-inner').css('left'));
        var topBoundary = event.clientY - $('.img-container-outer').offset().top - parseFloat($('.img-container-inner').css('top'));
        console.info("lefBoundary=",leftBoundary,"  topBoundary=",topBoundary);
        console.info("picLeft=",_this.moveObj.picLeft,"  picTop=",_this.moveObj.picTop);

        if ((leftBoundary >= _this.moveObj.picLeft) && (leftBoundary <= _this.moveObj.picLeft +_this. moveObj.width) && (topBoundary >= _this.moveObj.picTop) && (topBoundary <= _this.moveObj.picTop + _this.moveObj.height)) {
            _this.moveObj.dragBool = true;
            _this.moveObj.strechBool = false;
        }
        if ((leftBoundary >= (_this.moveObj.picLeft + _this.moveObj.width - 20)) && (leftBoundary <= (_this.moveObj.picLeft + _this.moveObj.width + 20)) && (topBoundary >= (_this.moveObj.picTop + _this.moveObj.height - 20)) && (topBoundary <= (_this.moveObj.picTop + _this.moveObj.height + 20))) {
            _this.moveObj.strechBool = true;
            _this.moveObj.dragBool = false;
        }
    },
    mousemoveFunc: function() {
        var _this = this;
        var xDistance, yDistance, lastLeft, lastTop, lastWidth, lastHeight;
        //按住鼠标拖动图片
        if (_this.moveObj.dragBool) {
            _this.moveObj.mouseXDistance = event.clientX - _this.moveObj.mouseXStart;
            _this.moveObj.mouseYDistance = event.clientY - _this.moveObj.mouseYStart;
            xDistance = _this.moveObj.mouseXDistance;
            yDistance = _this.moveObj.mouseYDistance;
            _this.moveObj.picLeft += xDistance;
            _this.moveObj.picTop += yDistance;
            lastLeft = _this.moveObj.picLeft;
            lastTop = _this.moveObj.picTop;
            if (lastLeft <= 0) {
                _this.moveObj.picLeft = 0;
                lastLeft = 0;
            } else {
                if (lastLeft + _this.moveObj.width >= _this.initialImgObj.changedWidth) {
                    lastLeft = _this.initialImgObj.changedWidth - _this.moveObj.width;
                    _this.moveObj.picLeft = lastLeft;
                }
            }
            if (lastTop <= 0) {
                lastTop = 0;
                _this.moveObj.picTop = 0;
            } else {
                if (lastTop + _this.moveObj.height >= _this.initialImgObj.changedHeight) {
                    lastTop = _this.initialImgObj.changedHeight - _this.moveObj.height;
                    _this.moveObj.picTop = lastTop;
                }
            }
            _this.movePic(lastLeft, lastTop);
            _this.moveObj.mouseXStart = event.clientX;
            _this.moveObj.mouseYStart = event.clientY;
        }

        var leftBoundary = event.clientX - $('.img-container-outer').offset().left - parseFloat($('.img-container-inner').css('left'));
        var topBoundary = event.clientY - $('.img-container-outer').offset().top - parseFloat($('.img-container-inner').css('top'));
        // var leftBoundary = event.offsetX;
        // var topBoundary = event.offsetY;

        _this.moveObj.picLeft = parseFloat($('.img-container').css('left'));
        _this.moveObj.picTop = parseFloat($('.img-container').css('top'));
        if ((leftBoundary >= (_this.moveObj.picLeft + _this.moveObj.width - 20)) && (leftBoundary <= (_this.moveObj.picLeft + _this.moveObj.width + 20)) && (topBoundary >= (_this.moveObj.picTop + _this.moveObj.height - 20)) && (topBoundary <= (_this.moveObj.picTop + _this.moveObj.height + 20))) {
            $('.img-container-outer').get(0).style.cursor = 'se-resize';
        } else if ((leftBoundary >= _this.moveObj.picLeft) && (leftBoundary <= _this.moveObj.picLeft + _this.moveObj.width) && (topBoundary >= _this.moveObj.picTop) && (topBoundary <= _this.moveObj.picTop + _this.moveObj.height)) {
            $('.img-container-outer').get(0).style.cursor = 'move';
        } else {
            $('.img-container-outer').get(0).style.cursor = 'default';
        }
        // var leftBoundary = parseFloat($('.img-container').css('left'));
        // var topBoundary = parseFloat($('.img-container').css('top'));


        //拉伸小方框
        var move_distance;
        if (_this.moveObj.strechBool) {
            _this.moveObj.mouseXDistance = event.clientX - _this.moveObj.mouseXStart;
            _this.moveObj.mouseYDistance = event.clientY - _this.moveObj.mouseYStart;
            xDistance = _this.moveObj.mouseXDistance;
            yDistance = _this.moveObj.mouseYDistance;

            if (xDistance >=0 && yDistance>=0) {
                move_distance = Math.max(xDistance, yDistance);                
            } else {
                move_distance = Math.min(xDistance, yDistance);
            }
            _this.moveObj.width += move_distance;
            _this.moveObj.height += move_distance;
            // if (_this.moveObj.width / _this.moveObj.height >= _this.moveObj.WHRatio) {
            //     _this.moveObj.width = _this.moveObj.WHRatio *_this.moveObj.height;
            // } else {
            //     _this.moveObj.height = _this.moveObj.width / _this.moveObj.WHRatio;
            // }
            lastWidth = _this.moveObj.width;
            lastHeight = _this.moveObj.height;
            if (lastWidth <= 10) {
                lastWidth = 10;
                _this.moveObj.width = 10;
                _this.moveObj.height = 10;
            } else if ((lastWidth + _this.moveObj.picLeft) >= _this.initialImgObj.changedWidth) {
                lastWidth = _this.initialImgObj.changedWidth - _this.moveObj.picLeft;
                _this.moveObj.width = lastWidth;
                _this.moveObj.height = lastWidth;
            }

            if (lastHeight <= 10) {
                lastHeight = 10;
                _this.moveObj.height = 10;
                _this.moveObj.width = 10;

            } else if ((lastHeight + _this.moveObj.picTop) >= _this.initialImgObj.changedHeight) {
                lastHeight = _this.initialImgObj.changedHeight - _this.moveObj.picTop;
                _this.moveObj.height = lastHeight;
                _this.moveObj.width = lastHeight;
            }
            _this.stretchPic(lastWidth, lastHeight);

            _this.moveObj.mouseXStart = event.clientX;
            _this.moveObj.mouseYStart = event.clientY;
        }
    },
    mouseupFunc: function() {
        var _this = this;
        _this.moveObj.dragBool = false;
        _this.moveObj.strechBool = false;
    },
    diyWidthAndHeight: function() {
        var _this = this;
        var widthHeightRatio, nowWidth, nowHeight;
        var $inputWidth = $("input[name='portrait-width']");
        var $inputHeight = $("input[name='portrait-height']");
        var canvasElement = $('.small-pic').get(0);
        $('.diy-portrait span').click(function(){
            nowWidth = _this.moveObj.width;
            nowHeight = _this.moveObj.height;
            var portraitWidth = parseFloat($inputWidth.val());
            var portraitHeight = parseFloat($inputHeight.val());
            
            if ( portraitWidth && portraitHeight) {
                _this.moveObj.lastImgWidth = portraitWidth; 
                _this.moveObj.lastImgHeight = portraitHeight;
                widthHeightRatio = portraitWidth / portraitHeight;
                _this.moveObj.WHRatio = widthHeightRatio;
                if (nowWidth / nowHeight >= _this.moveObj.WHRatio) {
                    _this.moveObj.width = _this.moveObj.WHRatio*nowHeight
                } else {
                    _this.moveObj.height = nowWidth / _this.moveObj.WHRatio;
                }
                // _this.changedSmallPic(_this.moveObj.width, _this.moveObj.height);
                _this.stretchPic(_this.moveObj.width, _this.moveObj.height);
            } else {
                $inputWidth.val("");
                $inputHeight.val("");
                alert('请填写正确的高度或宽度值');
            }
        })
    },
    changedSmallPic: function(width, height) {
        var _this = this;
        var $smallPic = $('.small-pic');
        $smallPic.attr({
            width:width,
            height: height 
        }).css({
            width: width,
            height: height 
        })
        var str = parseInt(width) + "X" + parseInt(height) + "像素"
        $('.pixel').html(str);
    },
    canvasToImge: function(left, top, width, height) {
        var _this = this;
        var lastX ,lastY, lastWidth, lastHeight;
        var lastX2, lastY2, lastWidth2, lastHeight2;
        var canvasElement = $('.small-pic').get(0);
        var targetCtx = canvasElement.getContext('2d');
        targetCtx.clearRect(0,0,canvasElement.width,canvasElement.height);
    
        lastX = left * _this.initialImgObj.scale;
        lastY = top * _this.initialImgObj.scale;
        lastWidth = width * _this.initialImgObj.scale;
        lastHeight = height * _this.initialImgObj.scale;
        lastX2 = 0;
        lastY2 = 0;
        lastWidth2 = width;
        lastHeight2 = height;
        targetCtx.drawImage(_this.moveObj.imgObj, lastX, lastY, lastWidth, lastHeight, lastX2, lastY2, canvasElement.width, canvasElement.height);
        _this.moveObj.lastImgUrl = canvasElement.toDataURL('image/png');
    },
    targetCanvas: function(imgObj, lastX, lastY, lastWidth, lastHeight, lastX2, lastY2, lastWidth2, lastHeight2) {
        var _this = this;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = _this.canvas.width;
        canvas.height = _this.canvas.height;

        ctx.drawImage(imgObj, lastX, lastY, lastWidth, lastHeight, lastX2, lastY2, canvas.width, canvas.height);
        _this.moveObj.lastImgUrl =  canvas.toDataURL('image/png');
    },
    submitResult: function() {
        var _this = this;
        console.log(_this.moveObj.lastImgUrl);
    },
    resetFunc: function() {
        var _this = this;
        _this.moveObj.dragBool = false;
        _this.moveObj.strechBool = false;
        _this.moveObj.mouseXStart = 0;
        _this.moveObj.mouseYStart = 0;
        _this.moveObj.mouseXDistance = 0;
        _this.moveObj.mouseYDistance = 0;
        _this.moveObj.width = 0;
        _this.moveObj.height = 0;
        _this.moveObj.picLeft = 0;
        _this.moveObj.picTop = 0;
        _this.moveObj.minWidth = 10;
        _this.moveObj.minHeight = 10;
        _this.moveObj.WHRatio = 1;
        _this.moveObj.initialWidth = 80;
        _this.moveObj.initialHeight = 80;
        _this.moveObj.imgObj = "";

        _this.initialImgObj.initialWidth = 0;
        _this.initialImgObj.initialHeight = 0;
        _this.initialImgObj.changedWidth = 0;
        _this.initialImgObj.changedHeight = 0;
        _this.initialImgObj.changedX0 = 0;
        _this.initialImgObj.changedY0 = 0;
        _this.initialImgObj.scale = 0;

        _this.trigger();
    }
}