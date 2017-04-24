;(function() {
    'use strict';
    var $form_add_task = $('.add-task'),
        $body = $('body'),
        $window = $(window),
        $task_delete_trigger,
        $task_detail_trigger,
        $task_detail = $('.task-detail'),
        $task_detail_mask = $('.task-detail-mask'),
        task_list = [],
        current_index,
        $update_form,
        $task_detail_content,
        $task_detail_content_input,
        $checkbox_complete,
        $msg = $('.msg'),
        $msg_content = $msg.find('.msg-content'),
        $msg_confirm = $msg.find('.confirmed'),
        $alerter = $('.alerter')
    ;

    init();


    $form_add_task.on('submit', on_add_task_form_submit);
    $task_detail_mask.on('click', hide_task_detail);

    function on_add_task_form_submit(event) {
        var new_task = {}, $input;
        event.preventDefault();
        $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        if (!new_task.content) return;
        if (add_task(new_task)) {
            $input.val(null);
        }
    }

    function confirm(arg) {
        if (!arg) {
            console.error('confirm title is required');
        }
        var conf = {},
            $box,
            $mask,
            $title,
            $content,
            $confirm,
            confirmed,
            $cancel,
            timer,
            dfd
        ;
        dfd=$.Deferred();
        if (typeof arg == 'string') {
            conf.title = arg;
        } else {
            conf = $.extend(conf, arg);
        }
        $mask = $('<div></div>')
            .css({
                position: 'fixed',
                background: 'rgba(0,0,0,.5)',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0

            });
        $box = $('<div>' +
            '<div class="confirm-title">'+ conf.title +'</div>' +
            '<div class="confirm-content ">' +
            '<div>' +
            '<button style="margin-right: 5px" class="primary confirm">确定</button>' +
            '<button class="cancel">取消</button></div>' +
            '</div>' +
            '</div>')
            .css({
                position: 'fixed',
                color:'#444',
                width: 300,
                height: 'auto',
                padding:'15px 0',
                background: '#fff',
                'border-radius': 5,
                'box-shadow': '0 1px 2px rgba(0,0,0,.5)'
            });
        $title = $box.find('.confirm-title').css({
            padding:'5px 10px',
            'font-weight':900,
            'font-size': 20,
            'text-align':'center'
        });
        $content = $box.find(('.confirm-content')).css({
            padding:'5px 10px',
            'text-align':'center'
        });

        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');

        timer = setInterval(function() {
            if (confirmed !== undefined) {
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_confirm();
            }
        }, 50);

        function dismiss_confirm() {
            $mask.remove();
            $box.remove();
        }
        $confirm.on('click',function() {
            confirmed = true;
        });
        $cancel.on('click',on_cancel);
        $mask.on('click',on_cancel);
        function on_cancel() {
            confirmed = false;
        }
        function adjust_box_position() {
            var window_width = $window.width(),
                window_height = $window.height(),
                box_width = $box.width(),
                box_height = $box.height(),
                move_x,
                move_y;
            move_x = (window_width - box_width) / 2;
            move_y = ((window_height - box_height) / 2) - 20;

            $box.css({
                left: move_x,
                top: move_y
            })
        }

        $window.on('resize', function() {
            adjust_box_position();
        });

        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();
    }

    function listen_msg_event() {
        $msg_confirm.on('click', function() {
            hide_msg();
        })
    }

    function listen_task_detail() {
        var index;
        $('.task-item').on('dblclick', function() {
            index = $(this).data('index');
            show_task_detail(index);
        });
        $task_detail_trigger.on('click', function() {
            var $this = $(this);
            var $item = $this.parent().parent();
            index = $item.data('index');
            show_task_detail(index);
        });
    }

    function listen_checkbox_complete() {
        $checkbox_complete.on('click', function() {
            var $this = $(this);
            var is_complete = $this.is(':checked');
            var index = $this.parent().parent().data('index');
            update_task(index, {complete: is_complete});
        });
    }

    function show_task_detail(index) {
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }

    function update_task(index, data) {
        if (index === undefined || !task_list[index]) return;
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    function hide_task_detail(index) {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    function render_task_detail(index) {
        if (index === undefined || !task_list[index]) return;
        var item = task_list[index];
        var tpl = '<form>' +
            '<div class="content">' +
            item.content +
            '</div>' +
            '<div>' +
            '<input class="input-item" style="display: none;" ' +
            'autocomplete="off" ' +
            'type="text" name="content" ' +
            'value="' + item.content + '">' +
            '</div>' +
            '<div>' +
            '<div class="desc input-item">' +
            '<textarea name="desc" placeholder="描述一下～">' + (item.desc || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind input-item">' +
            '<label style="margin-bottom: 10px">提醒时间</label>' +
            '<input class="datetime" name="remind_date" type="text" value="' + (item.remind_date || '') + '">' +
            '</div>' +
            '<button class="input-item" type="submit">更新</button>' +
            '</form>'
        ;
        $task_detail.html(null).html(tpl);
        $update_form = $task_detail.find('form');
        $('.datetime').datetimepicker();
        $task_detail_content = $update_form.find('.content');
        $task_detail_content_input = $update_form.find('[name=content]');

        $task_detail_content.on('dblclick', function() {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });
        $update_form.on('submit', function(event) {
            event.preventDefault();
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index, data);
            hide_task_detail();
        })
    }

    function listen_task_delete() {
        $task_delete_trigger.on('click', function() {
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            confirm('确认删除？')
                .then(function(result) {
                    result ? delete_task(index) : null;
                })
        });
    }

    function add_task(new_task) {
        task_list.push(new_task);
        refresh_task_list();
        return true;
    }

    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();
    }

    function delete_task(index) {
        if (index === undefined || !task_list[index]) return;
        delete task_list[index];
        refresh_task_list();
    }

    function init() {
        listen_msg_event();
        task_list = store.get('task_list') || [];
        if (task_list.length) {
            render_task_list();
            task_remind_check();
        }
    }

    function task_remind_check() {
        var current_timestamp;
        var itl = setInterval(function() {
            for (var i = 0; i < task_list.length; i++) {
                var item = get(i), task_timestamp;
                if (!item || !item.remind_date || item.informed) continue;
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if (current_timestamp - task_timestamp >= 1) {
                    update_task(i, {informed: true});
                    show_msg(item.content);
                }
            }
        }, 500);
    }

    function show_msg(msg) {
        if (!msg) return;
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }

    function hide_msg() {
        $msg.hide();
        $alerter.get(0).pause();
    }

    function get(index) {
        return store.get('task_list')[index];
    }

    function render_task_list() {
        var $task_list = $('.task-list');
        $task_list.html('');
        var complete_items = [];
        for (var i = 0; i < task_list.length; i++) {
            var item = task_list[i];
            if (item && item.complete) {
                complete_items[i] = item;
            } else {
                var $task = render_task_item(item, i);
                $task_list.prepend($task);
            }
        }

        for (var j = 0; j < complete_items.length; j++) {
            $task = render_task_item(complete_items[j], j);
            if (!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }
        $task_delete_trigger = $('.action.delete');
        $task_detail_trigger = $('.action.detail');
        $checkbox_complete = $('.task-list .complete');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }

    function render_task_item(data, index) {
        if (!data || !index) return;
        var list_item_tpl =
            '<div class="task-item" data-index="' + index + '">' +
            '<span><input class="complete " ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="action delete"> 删除</span>' +
            '<span class="action detail"> 详情</span>' +
            '</span>' +
            '</div>';
        return $(list_item_tpl);
    }
})();

