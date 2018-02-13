$.extend({
    "new": function (tag) {
        return $(document.createElement(tag));
    }
})
$.fn.extend({
    "screenLeft": function () {
        return $(this).offset().left - $(window).scrollLeft();
    }, "screenTop": function () {
        return $(this).offset().top - $(window).scrollTop();
    }, //judge whether event occur inside the box
    "isInside": function (event) {
        if (!event || !event.clientX || !event.clientY) {
            return false;
        }
        var x = event.clientX;
        var y = event.clientY;
        var left = $(this).screenLeft();
        var top = $(this).screenTop();
        var right = left + $(this).width();
        var bottom = top + $(this).height();
        return x >= left && x <= right && y >= top && y <= bottom;
    }, //judge whether event occur around the east-south corner of the box
    "isSouthEast": function (event, gap) {
        if (!event || !event.clientX || !event.clientY) {
            return false;
        }
        var x = event.clientX;
        var y = event.clientY;
        var left = $(this).screenLeft();
        var top = $(this).screenTop();
        var right = left + $(this).width();
        var bottom = top + $(this).height();
        return x >= (right - gap) && x <= right && y >= (bottom - gap) && y <= bottom;
    }
})

/**
 * 图像裁剪
 * @param $root 根节点jQuery对象
 * @param options 额外
 * @constructor
 */
function ImageCut($root, options) {
    var defaultOption = {
        shape: [300, 300],//container shape:[width,height]
        preview: null, //cutted-img preview node, null to no preview
        previewShape: [150, 150], fileInput: null, //input with file type, definitely needed.
        fileSize: 200 * 1000, //max upload file size
        reshape: false, //if cut area is reshapable
        detailInfo: false, //whether detail display info is needed
        submitBtn: null, //submit button
        callback: null, //callback function with base64 image as parameter
    }
    if (!$root) return;
    var _this = this;
    var _$root = $($root);
    var _opts = $.extend(defaultOption, options);

    //extra params
    _this.changeStatus = "";
    _this.clickX = 0;
    _this.clickY = 0;
    _this.iterBox = null;
    _this.iterChildBox = null;
    _this.imageSrc = null;

    /**
     * create html part of image cut
     */
    var initHTML = function () {
        var $root = _$root;
        var opts = _opts;
        var html = '\
            <div class="img-container-outer" style="display: block">\
                <div class="img-container-wrap">\
                    <img id="bgImg" class="fullfill"/>\
                    <div class="img-container-inner">\
                        <div class="img-container" bordercross=true>\
                            <img id="cutImg" xmovecoe="0" ymovecoe="0"/>\
                            <div class="drag-icon"></div>\
                            <div class="width-info"></div>\
                            <div class="height-info"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>'
        $root.append(html);
        //set the size of the base container
        var $outer = $(".img-container-outer");
        $outer.css({
            width: opts.shape[0], height: opts.shape[1]
        })

        //cut image preview draw by canvas
        if (opts.preview) {
            var $preview = $(opts.preview);
            var canvasHtml = '\
                <div class="small-pic-container">\
                    <canvas class="small-pic">\
                    </canvas>\
                </div>';
            $preview.append(canvasHtml);
            $(".small-pic").attr({
                width: _opts.previewShape[0], height: _opts.previewShape[1]
            })
        }
    };

    var canvasToImge = function ($cutSource, $target) {
        var x, y, width, height,twidth,theight;
        twidth = $target[0].width;
        theight = $target[0].height;
        var targetCtx = $target[0].getContext('2d');
        targetCtx.clearRect(0, 0, twidth, theight);
        var scale = $cutSource.attr("data-scale");
        if (!scale) {
            return;
        }
        x = $cutSource.position().left * scale;
        y = $cutSource.position().top * scale;
        width = $cutSource.width() * scale;
        height = $cutSource.height() * scale;
        console.info("targetWidth=",$target.width(),"  targetHeight=", $target.height());
        targetCtx.drawImage(_this.imageSrc, x, y, width, height, 0, 0, twidth, theight);
    };


    var bindInputFileEvent = function () {
        var imageURL;
        var opts = _opts;
        if (opts.fileInput) {
            var $fileInput = $(opts.fileInput);
            $fileInput.change(function (event) {
                var event = event ? event : window.event;
                var file = $(this).get(0).files[0];
                if (file && window.URL) {
                    imageURL = window.URL.createObjectURL(file);
                } else {
                    imageURL = $(this)[0].value;
                }
                var $imgContainerOuter = $('.img-container-outer').show();
                var $imgContainerWrap = $('.img-container-wrap');

                var $imgContainer = $('.img-container');
                var IMG = new Image();
                IMG.onload = function () {
                    var widthScale = IMG.width / opts.shape[0];
                    var heightScale = IMG.height / opts.shape[1];
                    var scale = Math.max(widthScale, heightScale);
                    var reWidth = parseFloat(IMG.width / scale);
                    var reHeight = parseFloat(IMG.height / scale);
                    $imgContainerWrap.css({
                        width: reWidth,
                        height: reHeight,
                        left: reWidth < $imgContainerOuter.width() ? (opts.shape[0] - reWidth) / 2 : 0,
                        top: reHeight < $imgContainerOuter.height() ? (opts.shape[1] - reHeight) / 2 : 0
                    });
                    var $bgImg = $("#bgImg").attr({
                        src: imageURL
                    });
                    var $cutImg = $("#cutImg").attr({
                        src: imageURL
                    }).css({
                        width: reWidth, height: reHeight, left: 0, top: 0
                    });

                    var cutWidth = 100;
                    var cutHeight = 100;
                    var cutLeft = (reWidth - cutWidth) / 2;
                    var cutTop = (reHeight - cutHeight) / 2;
                    $imgContainer.css({
                        width: cutWidth, height: cutHeight, left: 0, top: 0
                    }).attr("data-scale", scale);
                    _this.iterBox = new IteratorBox($(".img-container-inner"));
                    _this.iterChildBox = _this.iterBox.getChildren()[0];
                    //put cut box to the middle
                    _this.iterBox.moveChildTo(_this.iterChildBox,cutLeft,cutTop);
                    canvasToImge($(".img-container"),$(".small-pic"))
                }
                IMG.src = imageURL;
                _this.imageSrc = IMG;
            })
        }
    }

    var bindMouseEvent = function () {
        $(document).on('mousedown', mousedownFunc);
        $(document).on('mousemove', mousemoveFunc);
        $(document).on('mouseup', function () {
            setChangeStatus("");
        });
        $(document).on('mouseleave', function () {
            //                console.info("mouseleave")
            setChangeStatus("");
        });
        if (_opts.submitBtn) {
            $(_opts.submitBtn).on('click', function () {
                _this.submit();
            })
        }
    };
    var appendCss = function () {
        var cssHtml = '<style>.fullfill{width:100%;height:100%}.img-container-outer{border:1px solid #9baab3;position:relative}.img-container-outer{-moz-user-select:none;-khtml-user-select:none;user-select:none}.img-container-outer img{position:absolute}.img-container-wrap{position:absolute}.img-container-inner{width:100%;height:100%;background-color:rgba(0,0,0,.6);position:absolute}.img-container{overflow:hidden;position:absolute;cursor:move}.img-container-inner .drag-icon{width:15px;height:15px;position:absolute;bottom:0;right:0;cursor:se-resize;background-color:rgba(255,255,255,.5);background:url(../drag.png) 0 0 no-repeat;background-size:cover;z-index:9}img{pointer-events:none}</style>'
        _$root.append(cssHtml);
    };

    var mousedownFunc = function (event) {
        //            var a = event;
        //            var b = window.event;
        //            console.info(a === b);
        //record mousedown event
        setChangeStatus("");
        _this.clickX = event.clientX;
        _this.clickY = event.clientY;
        var $box = $(".img-container");
        if ($box.isInside(event)) {
            record("img-container", $box);
            setChangeStatus("move");
            if ($box.isSouthEast(event, 15)) {
                setChangeStatus("se");
            }
        }
    };
    var mousemoveFunc = function (event) {
        //            var a = event;
        //            var b = window.event;
        //            console.info(a === b);
        var dx = event.clientX - _this.clickX;
        var dy = event.clientY - _this.clickY;
        //            console.info("mousemove", " x=", event.clientX, "  y=", event.clientY);
        var boxInfo = getRecord("img-container");
        //            console.info(boxInfo)
        var $box = $(".img-container");
        switch (_this.changeStatus) {
            case "":
                break;
            case "move":
                _this.iterBox.moveChildTo(_this.iterChildBox, dx + boxInfo.left, dy + boxInfo.top);
                canvasToImge($(".img-container"),$(".small-pic"));
                break;
            case "se":
                if (_opts.reshape) {

                }
                var shape = [boxInfo.width + dx, boxInfo.height + dy];
                _this.iterBox.reShapeChild(_this.iterChildBox, shape, _opts.reshape);
                canvasToImge($(".img-container"),$(".small-pic"));
                break;
        }
    };

    var record = function (name, $obj) {
        if (!$obj) return;
        _this[name] = {
            top: $obj.position().top, left: $obj.position().left, width: $obj.width(), height: $obj.height()
        }
    }
    var getRecord = function (name) {
        return _this[name];
    }
    var setChangeStatus = function (status) {
        _this.changeStatus = status;
    }

    this.setReshape = function (reshape) {
        _opts.reshape = !!reshape;
    };
    this.getDataUrL = function () {
        var canvasElement = $('.small-pic').get(0);
        return canvasElement.toDataURL('image/png');
    };
    //submit img data through callback
    this.submit = function () {
        if(!_this.imageSrc){
            alert("请选择图片！")
            return;
        }

        var cb = _opts.callback;
        if (cb) {
            var dataUrl = this.getDataUrL();
            cb(dataUrl);
        }
    }
    this.init = function () {
        initHTML();
        bindInputFileEvent();
        bindMouseEvent();
        appendCss();
    }
}


/**
 * you can handle all child nodes and child nodes of child by only move their root node
 * and iterate moving the children with setted regulation
 */
function IteratorBox(container, params) {
    var _childlist = [];
    var _params = $.extend({
        //x,y move coe when parant box moved, coe=1 means move as same as parent, coe=0 means stay where it was
        xMoveCoe: 1, yMoveCoe: 1, //whether the child node can cross the border [top,right,bottom,left]
        borderCross: false
    }, params);
    var _$container = $(container);
    var _containerShape = [_$container.width(), _$container.height()];
    var children = _$container.children();
    for (var i = 0; i < children.length; i++) {
        var child = children.eq(i);
        var xMoveCoe = child.attr("xmovecoe");
        var yMoveCoe = child.attr("ymovecoe");
        var borderCross = child.attr("bordercross");
        if (xMoveCoe || yMoveCoe || borderCross !== undefined) {
            xMoveCoe = parseInt(xMoveCoe);
            yMoveCoe = parseInt(yMoveCoe);
            borderCross = !!eval(borderCross)
            _childlist.push(new IteratorBox(child, {
                xMoveCoe: xMoveCoe, yMoveCoe: yMoveCoe, borderCross: !!borderCross
            }))
        }
    }
    //self move function, after that move all child box base on setted regulation
    this.moveSelf = function (x, y) {
        var _left = this.getLeft();
        var _top = this.getTop();
        _$container.css({
            left: _left + x, top: _top + y
        })
        for (var i in _childlist) {
            var child = _childlist[0];
            var moveCoe = child.getMoveCoe();
            child.moveSelf(x * (moveCoe[0] - 1), y * (moveCoe[1] - 1));
        }
    }
    /**
     * move item inside imgBox by x,y and ensure not crossing the boarder
     * @param child
     * @param x
     * @param y
     */
    this.moveChild = function (child, x, y) {
        var cLeft = child.getLeft();
        var cTop = child.getTop();
        //                var newLeft, newTop;
        //                if (x > 0) {
        //                    newLeft = (cLeft + x) > (_containerShape[0] - $child.width) ? (_containerShape[0] - $child.width) : (cLeft + x);
        //                } else {
        //                    newLeft = (cLeft + x) < 0 ? 0 : (cLeft + x);
        //                }
        //                if (y > 0) {
        //                    newTop = (cTop + x) > (_containerShape[1] - $child.height) ? (_containerShape[1] - $child.height) : (cTop + x);
        //                } else {
        //                    newTop = (cTop + x) < 0 ? 0 : (cTop + x);
        //                }
        //                $child.css({
        //                    top: newTop,
        //                    left: newLeft
        //                })
        this.moveChildTo(child, x + cLeft, y + cTop);
    }
    /**
     * move to a specific point
     */
    this.moveChildTo = function (child, left, top) {
        var cLeft = child.getLeft();
        var cTop = child.getTop();
        if (left < 0 && !_params.borderCross) {
            left = 0;
        } else if (left > (_containerShape[0] - child.getShape()[0]) && !_params.borderCross) {
            left = _containerShape[0] - child.getShape()[0];
        }
        if (top < 0 && !_params.borderCross) {
            top = 0;
        } else if (top > (_containerShape[1] - child.getShape()[1]) && !_params.borderCross) {
            top = _containerShape[1] - child.getShape()[1];
        }
        child.moveSelf(left - cLeft, top - cTop);
    }
    /**
     * reshape item inside imgBox and ensure not crossing boarder
     * @param child
     * @param shape
     */
    this.reShapeChild = function (child, shape, reshape) {
        var cLeft = child.getLeft();
        var cTop = child.getTop();
        var realWidth, realHeight;
        if (reshape) {
            realWidth = ((shape[0] + cLeft) > _containerShape[0] && !_params.borderCross) ? (_containerShape[0] - cLeft) : shape[0];
            realHeight = ((shape[1] + cTop) > _containerShape[1] && !_params.borderCross) ? (_containerShape[1] - cTop) : shape[1];
        } else {
            //if not allow to reshape
            var childWH = child.getShape()[0] / child.getShape()[1];
            var parentWH = (_$container.width() - cLeft) / (_$container.height() - cTop);
            var shapeWH = shape[0] / shape[1];
            var realNeedShape = [0, 0];
            if (shapeWH <= childWH) {
                //width is too small,so height is real
                realNeedShape[1] = shape[1];
                realNeedShape[0] = shape[1] * childWH;
            } else {
                //height is too small,so width is real
                realNeedShape[0] = shape[0];
                realNeedShape[1] = shape[0] / childWH;
            }
            //                console.info("reshape  width=",shape[0],"  height=",shape[1],"   realWidth=",realNeedShape[0]," realHeight=",realNeedShape[1]);
            if (childWH > parentWH) {
                //first to hit right
                realWidth = ((realNeedShape[0] + cLeft) > _containerShape[0] && !_params.borderCross) ? (_containerShape[0] - cLeft) : realNeedShape[0];
                realHeight = realWidth / childWH;
            } else {
                //first to hit bottom
                realHeight = ((realNeedShape[1] + cTop) > _containerShape[1] && !_params.borderCross) ? (_containerShape[1] - cTop) : realNeedShape[1];
                realWidth = realHeight * childWH;
            }
        }
        if (realWidth < 50 || realHeight < 50) {
            return;
        }
        child.addCss({
            width: realWidth, height: realHeight
        })
    }

    this.getLeft = function () {
        return _$container.position().left;
    }
    this.getTop = function () {
        return _$container.position().top;
    }
    this.getShape = function () {
        return [_$container.width(), _$container.height()];
    }
    this.getMoveCoe = function () {
        return [_params.xMoveCoe, _params.yMoveCoe];
    }
    //child must be instance of IteratorBox
    this.addChild = function (child) {
        if (child instanceof IteratorBox) {
            _childlist.push(child)
        }
    };
    this.getChildren = function () {
        return _childlist;
    }
    this.addCss = function (params) {
        _$container.css(params);
    }
}