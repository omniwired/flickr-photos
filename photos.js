/*global jQuery*/

var cookie_name = 'favs';
var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function buildDicFromCookie () {

        var data = new RegExp('(?:^|; )' + cookie_name + '=([^;]*)').exec(document.cookie);
        var dic;
        if (data === null) { // didn't find the regexp
            dic = {};
        } else {
            dic = JSON.parse(data[1]);
        }
        return dic;
    }

    function getItem (key) {

        var encoded_key = encodeURIComponent(key);
        var dic = buildDicFromCookie();
        return dic[encoded_key];

    }
    function setItem (key, value) {

        var encoded_key = encodeURIComponent(key);
        var dic = buildDicFromCookie();

        dic[encoded_key] = value;
        document.cookie = cookie_name + '=' + JSON.stringify(dic);

    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    function favAppender (elm,img) {

        var fav = document.createElement('div');
        fav.className = 'fav';
        if (getItem(img.src) === 'true') {
            fav.className = fav.className + ' icon-heart';
        } else {
            fav.className = fav.className + ' icon-heart-empty';
            //window.localStorage.setItem(img.src,'false');
            //only remember the ones that were mark as favourite
        }
        fav.onclick = function() {
            key = this.parentElement.firstElementChild.src;
            // toogle
            if (getItem(key) === 'true') {
                setItem(key,'false');
                fav.className = 'fav icon-heart-empty';
            } else{
                setItem(key,'true');
                fav.className = 'fav icon-heart';
            }
        };
        elm.appendChild(fav);

    }

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            elm.className = 'photo';
            elm.appendChild(img);
            holder.appendChild(elm);
            //adding the fav functionality 
            favAppender(elm, img);
        };
    }

    // ----
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));


            callback();
        });
    };
}(jQuery));