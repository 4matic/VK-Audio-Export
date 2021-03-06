var downloads = window.downloadQueue || [],
    default_save_dir = false,// {path, fullPath}
    xhrs = {},
    service, tracker,
    choserOpened = false,
    downloadedSize = 0;
var userLabel = window.launchData && window.launchData.user_id ? ('User-' + window.launchData.user_id) : 'User';
service = analytics.getService('vk_audio_export');
// service.getConfig().addCallback(initAnalyticsConfig);
// Get a Tracker using your Google Analytics app Tracking ID.
tracker = service.getTracker('UA-88814053-1');
tracker.sendAppView('downloadsWindow');
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    //authorizing
    var action = message.action;
    delete message.action;
    console.log('chrome.runtime.onMessage.addListener', action, sender, message);
    if (sender.url && sender.url.indexOf('background_page.html') != -1) {
        if (action) {
            if(action == 'runNextTask') {
                var makeAction = function(message, sendResponse){
                    var savedAudio = saveAudio(message.data),
                        data = message.data, $download = $, $audioSize = $, $progress = $;
                    console.info('runNextTask');
                    if(data.audio) {
                        $download = $('.download-' + data.audio.id).eq(0).removeClass('waiting').addClass('downloading');
                        $progress = $download.find('.progress');
                        $audioSize = $progress.parent().find('.audio-size');
                    }

                    savedAudio.fail((function($down) {
                        return function(audioFile, error){
                            console.log('saveAudio.fail', audioFile);
                            sendMessage('finishFailAudioDownload', null, {data: audioFile, downloads: downloads.length});
                            $down.removeClass('downloading waiting').addClass('failed');
                            $down.find('.start-pause').attr('title', 'Не удалось скачать.').tooltip('fixTitle');
                            $down.find('.start-pause').off('click');
                            sendResponse({
                                error: audioFile
                            });
                        };
                    })($download));

                    savedAudio.done((function($down) {
                        return function(audioFile){
                            chrome.storage.local.get('downloadQueue', function(data){
                                if(data.downloadQueue) downloads = data.downloadQueue;
                                $('.downloads-num').text(downloads.length);
                            });
                            console.log('saveAudio.done', audioFile);
                            $down.removeClass('downloading waiting failed').addClass('downloaded');
                            sendResponse(audioFile);
                            if(audioFile.total) {
                                downloadedSize += audioFile.total;
                                var formattedSize = formatBytes(downloadedSize);
                                $('.downloaded-size').text(formattedSize).attr('title', 'Скачано ' + formattedSize).tooltip('fixTitle');
                            }
                            sendMessage('finishAudioDownload', null, $.extend(audioFile, {downloads: downloads.length}));
                        };
                    })($download));

                    savedAudio.progress((function($prog, $aSize) {
                        return function(percentComplete, event) {
                            $prog.children().css('width', percentComplete + "%");
                            if($aSize.hasClass('hide')) {
                                $aSize.text(formatBytes(event.total));
                                $aSize.removeClass('hide');
                            }
                        };
                    })($progress, $audioSize));
                };
                $(document).ready(function() {
                    if (!default_save_dir) initDownloads(function () {
                        makeAction(message, sendResponse);
                    });
                    else makeAction(message, sendResponse);
                });
                return true;
            } else if(action == 'pauseDownloadingTask') {
                var data = message.data,
                    audioID = data.audio && data.audio.id ? data.audio.id : false,
                    xhr = xhrs[audioID];
                if(xhr) {
                    xhr.abort();
                    sendResponse(true);
                } else sendResponse({error: 'XHR not found'});
                return true;
            }
        }
    } else {
        if(action) {
            if(action == "startAudioDownload") {
                prependDownload(message, true);
            } else if(action == "startBulkAudioDownload") {
                $.each(message, function(i, audio) {
                    prependDownload(audio, true);
                });
            }
        }
    }
});

function formatBytes(bytes) {
    if(bytes < 1024) return bytes + " Bytes";
    else if(bytes < 1048576) return(bytes / 1024).toFixed(1) + " KB";
    else if(bytes < 1073741824) return(bytes / 1048576).toFixed(1) + " MB";
    else return(bytes / 1073741824).toFixed(1) + " GB";
};

function sendMessage(action, callback, data) {
    if(action) {
        var msg = {
            action: action
        };
        // console.log('sendMessage', data);
        if(data && Object.keys(data).length > 0) {
            for(property in data) {
                msg[property] = data[property];
            }
        }
        chrome.runtime.sendMessage(msg, function(response){
            if(callback) callback(response);
            console.log('action', action, 'response', response);
            if(chrome.runtime.lastError) console.error('action', action, chrome.runtime.lastError);
        });
    }
}
function initDownloads(callback) {
    chrome.storage.local.get('maxRunningTasks', function(data){
        if(data.maxRunningTasks) {
            $('#maxRunningTasks').val(data.maxRunningTasks);
        }
    });
    chrome.storage.local.get('downloadQueue', function(data){
        if(data.downloadQueue) downloads = data.downloadQueue;
        chrome.storage.local.get('default_save_dir', function (data) {
            if(data && data.default_save_dir) {
                default_save_dir = data.default_save_dir;
                console.log('default_save_dir', default_save_dir);
                $('#choose_dir span').text(default_save_dir.fullPath ? default_save_dir.fullPath : default_save_dir);
            } else {
                $('#choose_dir span').text('Папка не выбрана');
            }
            callback();
        });
    });
}
function openDirectoryChoser($that, callback) {
    if(!choserOpened) {
        choserOpened = true;
        chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function (theEntry) {
            choserOpened = false;
            if (!theEntry) {
                $that.find('span').text('Папка не выбрана');
                return;
            }
            chrome.fileSystem.getDisplayPath(theEntry, function (displayPath) {
                var saveObject = {
                    path: chrome.fileSystem.retainEntry(theEntry),
                    fullPath: displayPath
                };
                chrome.storage.local.set({'default_save_dir': saveObject});
                default_save_dir = saveObject;
                $('#choose_dir span').text(displayPath);
                if(callback) callback();
            });
        });
    }
}
function saveAudio(download) {
    var downloadDef = new $.Deferred();
    var makeAudioRequest = function(download, downloadDef){
        var xhr = new XMLHttpRequest(),
            audioID = download.audio.id;
        xhr.open("GET", download.url);
        xhr.responseType = "blob";
        xhr.onprogress = function (event) {
            if (event.lengthComputable) {
                var percentComplete = Math.round(event.loaded / event.total * 100);
                return downloadDef.notify(percentComplete, event);
            }
        };
        xhr.onerror = function(e){
            delete xhrs[audioID];
            downloadDef.reject(e);
        };
        xhr.onload = function (event) {
            var blob = xhr.response;
            delete xhrs[audioID];
            chrome.fileSystem.restoreEntry(default_save_dir.path, function (restoredEntry) {
                console.log('restoredEntry', restoredEntry);
                chrome.fileSystem.getWritableEntry(restoredEntry, function (writeEntry) {
                    console.log('writeEntry', writeEntry, download);
                    var artist = download.audio &&  download.audio.artist ? download.audio.artist : 'VA Artist',
                        title = download.audio && download.audio.title ? download.audio.title : 'Unnamed';
                    fileName = artist + " - " + title;
                    fileName = fileName.replace(/[,.*;|"'?:/\\~&]/g ,'');
                    fileName = fileName.substring(200, length);
                    chrome.fileSystem.isWritableEntry(writeEntry, function(isWritable){
                        if(isWritable) {
                            writeEntry.getFile(fileName + '.mp3', {
                                create: true
                            }, function success(fileEntry) {
                                console.log('fileEntry', fileEntry);
                                fileEntry.createWriter(function (writer) {
                                    console.log('writer', writer);
                                    writer.onabort = function (e) {
                                        console.error('writer onabort', e);
                                        downloadDef.reject(e);
                                    };
                                    writer.onerror = function (e) {
                                        console.error('writer error', e);
                                        downloadDef.reject(e);
                                    };
                                    writer.onwriteend = function (e) {
                                        console.info('file.ready', e);
                                        tracker.sendEvent(userLabel, 'write.finish', JSON.stringify(download));
                                        downloadDef.resolve({
                                            name: fileEntry.name,
                                            data: download,
                                            total: e.total,
                                            fullPath: fileEntry.fullPath
                                        });
                                        // e.currentTarget.truncate(e.currentTarget.position);
                                    };
                                    writer.write(blob);
                                });
                            }, function error(error){
                                console.error('writing file ' + fileName);
                                // downloadDef.reject(error);
                                console.error(error);
                                downloadDef.reject(download, error);
                            });
                        } else {
                            console.error('not writable');
                            downloadDef.reject(download, 'not writable');
                        }
                    });
                });
            });
        };
        xhrs[audioID] = xhr;
        xhr.send();
    };
    if(default_save_dir) {
        if(download.url) {
            makeAudioRequest(download, downloadDef);
        } else {
            tracker.sendEvent(userLabel, 'download.fail.empty', JSON.stringify(download));
            downloadDef.reject(download, 'Empty url parameter');
        }
    } else {
        openDirectoryChoser($('#choose_dir'), function(){
            makeAudioRequest(download, downloadDef);
        });//todo: open folder choosing if empty
        // downloadDef.reject('Empty save directory');
    }
    return downloadDef;
}
/**
 *
 * @param e Audio
 */
function prependDownload(e, waiting) {
    var id = e.id;
    if(id) {
        var downloaded = false,
            classes = ['download', 'download-' + id];
        // if(downloads[id] && downloads[id].finished) {
        //     downloaded = true;
        //     classes.push('downloaded');
        // }
        var titleText = "Приостановить загрузку",
            redownload = "";
        if(waiting) classes.push('waiting');
        if(e.failed) {
            classes.push('failed');
            titleText = "Не удалось скачать.";
            redownload = '<a href="#" class="redownload" title="Попробовать скачать снова" data-placement="left"><i class="fa fa-repeat" aria-hidden="true"></i></a>';
        }
        console.log('prepend', e);
        var $download = $('<div class="' + classes.join(" ") + '" data-id="' + e.id + '">' +
            '<div class="middle"><h5><span class="artist">' + e.artist + '</span> - <span class="title" title="' + e.title + '">' + e.title + '</span></h5>' +
            '</div><div class="right"><span class="label label-default audio-size' + (e.total ? '' : ' hide') + '">' + formatBytes(e.total) + '</span>' +
            /* '<div class="checkbox">' +
            '<input type="checkbox" value="None" id="checkbox-' + id + '" name="check" />' +
            '<label for="checkbox-' + id + '"></label></div>' + */
            '<a href="#" class="start-pause" title="' + titleText + '" data-placement="left"><i class="fa fa-pause-circle" aria-hidden="true"></i></a>' + redownload +
            '</div>' +
            '<div class="progress">' +
            '<div class="progress-bar progress-bar-success" style="width: 0"></div>' +
            '</div>' +
            '</div>');
        (function (e) {
            var $redownload = $download.find('.redownload');
            if($redownload.length > 0) {
                $redownload.on('click', function (event) {
                    var trackData = $.extend({}, e);
                    delete trackData.url;
                    tracker.sendEvent(userLabel, 'redownload', JSON.stringify(trackData));
                    sendMessage('startAudioRedownload', function (answer) {
                        if(answer && answer.data && answer.data.audio) {
                            answer.data.audio.failed = false;
                            answer.data.audio.downloaded = true;
                            if(answer.total) {
                                answer.data.audio.total = answer.total;
                            }
                            if(answer.data.audio.id) {
                                tracker.sendEvent(userLabel, 'redownloaded', JSON.stringify(trackData));
                                $('.downloads .download-' + answer.data.audio.id).each(function(){
                                    $(this).removeClass('downloading waiting failed').addClass('downloaded');
                                });
                            }
                            prependDownload(answer.data.audio);
                            console.log('redownload answer', answer);
                        }
                    }, e);
                });
            }
            $download.find('.start-pause').on('click', function (event) {
                var $that = $(this);
                if(!$download.hasClass('paused')) {
                    sendMessage('pauseAudioDownload', function (answer) {
                        $download.addClass('paused');
                    }, e);
                } else {
                    sendMessage('resumeAudioDownload', function (answer) {
                        $download.removeClass('paused');
                        // if (!answer.paused) {
                        //     $parent.removeClass('paused');
                        //     $that.find('span').text('Остановить все');
                        // }
                        console.log('paused audio', answer);
                    }, e);
                }
                event.preventDefault();
            });
        })(e);
        if(e.total) {
            downloadedSize += e.total;
            var formattedSize = formatBytes(downloadedSize);
            $('.downloaded-size').text(formattedSize).attr('title', 'Скачано ' + formattedSize).tooltip('fixTitle').tooltip();
        }
        $('.downloads').prepend($download);
    }
}

$(document).ready(function(){
    initDownloads(function(success, error) {
        var downloadsNum = downloads.length;
        $('.downloads-num').text(downloadsNum);
        // if(default_save_dir)
        if(downloadsNum > 0) {
            for (var i = 0; i < downloadsNum; i++) {
                var e = downloads[i];
                prependDownload(e);
            }
        }
        var $actionsAll = $('#action_all');
        $actionsAll.find('.dropdown-menu a').on('click', function (e) {
            var $that = $(this),
                thatAction = $that.data('action'),
                thatHTML = $that.html(),
                $btn = $actionsAll.find('.btn-action');
                clickAction = $btn.data('action'),
                clickHTML = $btn.html();
            $btn.html(thatHTML);
            $that.html(clickHTML);
            $btn.data('action', thatAction);
            $that.data('action', clickAction);
            $btn.click();
        });
        $actionsAll.find('.btn-action').on('click', function (e) {
            var $that = $(this),
                $parent = $that.parent(),
                action = $that.data('action');
            console.log('clicked', action);
            if(action == 'stop') {
                if (!$parent.hasClass('paused')) {
                    sendMessage('pauseAllDownloads', function (answer) {
                        if (answer.paused) {
                            $parent.addClass('paused');
                            $that.find('span').text('Возобновить все');
                        }
                    });
                } else {
                    sendMessage('resumeAllDownloads', function (answer) {
                        if (!answer.paused) {
                            $parent.removeClass('paused');
                            $that.find('span').text('Остановить все');
                        }
                    });
                }
            } else {
                //accept clear list
                var $modal = $('#alert-modal');
                $modal.modal('show');
                $modal.find('.btn-yes').on('click', function(){
                    sendMessage('clearAllDownloads', function (answer) {
                        $('.downloads').empty();
                        $('.downloads-num').text(0);
                        $modal.modal('hide');
                    });
                });
            }
        });
        $('#choose_dir').on('click', function (e) {
            openDirectoryChoser($(this));
        });
        $('#maxRunningTasks').on('change', function(e){
            var $that = $(this),
                val = $that.val();
            console.log(val);
            sendMessage('changeMaxRunningTasks', function (answer) {
                console.log(answer);
            }, {value: val});
        });
        $(window).on('resize', function(){
            var windowHeight = $(window).height(),
                footerHeight = $('.footer').outerHeight(),
                headerHeight = $('.header').parent().outerHeight();
            $('.downloads').height(windowHeight - footerHeight - headerHeight - 20);
        });
        $(window).trigger('resize');
        $('[data-toggle="tooltip"]').tooltip();
    });
});