# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://jashkenas.github.com/coffee-script/



var stream = document.getElementById('stream');
var stream_post_list = document.getElementById('stream_post_list');
var pinned_post_list = document.getElementById('pinned_post_list');
var update_error = document.getElementById('update_error');
var backlog_area = document.getElementById('backlog_area');
var backlog_error = document.getElementById('backlog_error');
var new_post_content = document.getElementById('new_post_content');
var showing_post = null;
var update_delay = 4000;
<% lastpost = Post.last -%>
var latest = <%= lastpost ? lastpost.id : 0 %>;
var earliest = <%= @posts.first.id %>;

function scroll_stream () {
    stream.scrollTop = stream.scrollHeight;
}

function unshow_post () {
    if (showing_post) {
        showing_post.className = showing_post.className.replace(/(\s|^)showing(\s|$)/, ' ');
    }
    showing_post = null;
}
function show_post (ref) {
    var pinned = document.getElementById("pinned_" + parseInt(ref));
    if (pinned) {
        if (pinned == showing_post) {
            unshow_post();
        }
        else {
            pinned.scrollIntoView(true);
            pinned.className += " showing";
            if (showing_post) unshow_post();
            showing_post = pinned;
        }
    }
    else {
        var post = document.getElementById("post_" + parseInt(ref));
        if (post) {
            if (post == showing_post) {
                unshow_post();
            }
            else {
                post.scrollIntoView(true);
                post.className += " showing";
                if (showing_post) unshow_post();
                showing_post = post;
            }
        }
        else {
            unshow_post();
        }
    }
}
function reply_to_post (ref) {
    new_post_content.value += ">>" + parseInt(ref) + " ";
    new_post_content.focus();
}

function handle_update () {
    if (this.readyState == this.DONE) {
        if (this.status == 200) {
            if (this.responseXML != null) {
                html = this.responseXML;
                var new_posts = html.getElementById("new_posts");
                if (new_posts == null) {
                    make_error(update_error, "Update error: The server didn't include new_posts");
                    return;
                }
                var wants_scroll = (stream.scrollTop > stream.scrollHeight - stream.offsetHeight - 120);
                 // Update posts
                var added_posts = false;
                while (new_posts.firstChild != null) {
                    post = new_posts.firstChild;
                    if (post.nodeType == post.ELEMENT_NODE) {
                        added_posts = true;
                         // Add onclick handler for reply button, because I guess events on html
                         // elements loaded through AJAX don't get registered.  XSS safety?
                        var pid_match = post.id.match(/post_(\d+)/);
                        if (pid_match != null) {
                            var buttons = post.getElementsByTagName("button");
                            for (var i = 0; i < buttons.length; i++) {
                                if (buttons[i].className == "reply_button")
                                    buttons[i].onclick = function(){reply_to_post(parseInt(pid_match[1]));};
                            }
                        }
                         // Check if we need to pin/unpin/yell/unyell
                        var event_match = post.className.match(/(\s|^)this_(.*)_(.*)(\s|$)/);
                        if (event_match) {
                            if (event_match[2] == "pins") {
                                var pinned = document.getElementById("post_" + event_match[3]);
                                if (pinned) {
                                    pinned.className += " pinned";
                                    pinned_pinned = pinned.cloneNode();
                                    pinned_pinned.id = "pinned_" + event_match[3];
                                    pinned_post_list.appendChild(pinned_pinned);
                                }
                            }
                            else if (event_match[2] == "unpins") {
                                var pinned_unpinned = document.getElementById("pinned_" + event_match[3]);
                                if (pinned_unpinned) {
                                    pinned_post_list.removeChild(pinned_unpinned);
                                }
                                var unpinned = document.getElementById("post_" + event_match[3]);
                                if (unpinned) {
                                    unpinned.className = unpinned.className.replace(/(\s|^)pinned(\s|$)/, ' ');
                                }
                            }
                            else if (event_match[2] == "yells") {
                                var yelled = document.getElementById("post_" + event_match[3]);
                                if (yelled) yelled.className += " yelled";
                                var pinned_yelled = document.getElementById("pinned_" + event_match[3]);
                                if (pinned_yelled) pinned_yelled.className += " yelled";
                            }
                            else if (event_match[2] == "unyells") {
                                var unyelled = document.getElementById("post_" + event_match[3]);
                                if (unyelled)
                                    unyelled.className = unyelled.className.replace(/(\s|^)yelled(\s|$)/, ' ');
                                var pinned_unyelled = document.getElementById("pinned_" + event_match[3]);
                                if (pinned_unyelled)
                                    pinned_unyelled.className = pinned_unyelled.className.replace(/(\s|^)yelled(\s|$)/, ' ');
                            }
                        }
                    }
                     // Actually add the post
                    stream_post_list.appendChild(post);
                }
                 // Update latest post id
                new_latest = html.getElementById("new_latest");
                if (new_latest != null) latest = parseInt(new_latest.textContent);
                 // Update indicators
                var new_indicators = html.getElementById("new_indicators");
                if (new_indicators) {
                    var inds = new_indicators.getElementsByTagName("span");
                    if (inds.length == 0) make_error(update_error, "Warning: Server sent an empty new_indicators");
                    for (var i = 0; i < inds.length; i++) {
                        var ind = inds[i];
                        var old_ind = document.getElementById(ind.id);
                        if (old_ind) {
                            old_ind.className = ind.className;
                        }
                        else {
                            make_error(update_error, "Warning: Server sent a new " + ind.id + " but we don't have one of those.");
                        }
                    }
                }
                 // Set new timeout
                if (added_posts) update_delay = 4000;
                else if (update_delay < 32000) update_delay += 4000;
                setTimeout( "request_update()", update_delay );
                 // Scroll to bottom
                if (wants_scroll && added_posts) scroll_stream();
            }
            else {
                make_error(update_error, "Update error: The server didn't response with valid XML");
                return;
            }
        }
        else if (this.status != 0) {
            make_error(update_error, "Update error: The server returned " + this.status);
            return;
        }
    }
}

function handle_backlog () {
    if (this.readyState == this.DONE) {
        if (this.status == 200) {
            if (this.responseXML != null) {
                html = this.responseXML;
                var old_posts = html.getElementById("old_posts");
                if (old_posts == null) {
                    make_error(backlog_error, "Backlog error: The server didn't include old_posts");
                    return;
                }
                while (old_posts.lastChild != null) {
                    post = old_posts.lastChild;
                    stream_post_list.insertBefore(post, stream_post_list.firstChild);
                }
                var new_earliest = html.getElementById("new_earliest");
                if (new_earliest != null)
                    earliest = parseInt(new_earliest.textContent);
                else
                    backlog_area.textContent = "";

            }
            else {
                make_error(backlog_error, "Backlog error: The server didn't response with valid XML");
                return;
            }
        }
        else if (this.status != 0) {
            make_error(backlog_error, "Backlog error: The server returned " + this.status);
            return;
        }
    }
}

function make_error (loc, mess) {
    loc.textContent = mess;
}
function clear_error (loc) {
    loc.textContent = "";
}
function request_update () {
    var client = new XMLHttpRequest();
    client.onreadystatechange = handle_update;
    <% if @board -%>
    client.open("GET", "/main/update.xml?board=<%= @board.id %>&since=" + latest);
    <% else -%>
    client.open("GET", "/main/update.xml?since=" + latest);
    <% end -%>
    client.send();
}
setTimeout( "request_update()", update_delay );
function request_backlog () {
    clear_error(backlog_error);
    var client = new XMLHttpRequest();
    client.onreadystatechange = handle_backlog;
    <% if @board -%>
    client.open("GET", "/main/backlog.xml?board=<%= @board.id %>&before=" + earliest);
    <% else -%>
    client.open("GET", "/main/backlog.xml?before=" + earliest);
    <% end -%>
    client.send();
}
