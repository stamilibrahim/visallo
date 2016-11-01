define([
    './NotificationList',
    'flight/lib/component',
    'util/withDataRequest',
    'react-dom',
    'd3'
], function(NotificationList, defineComponent, withDataRequest, ReactDOM, d3) {
    'use strict';

    const NOTIFICATION_HOVER_EXPAND_DELAY_MILLIS = 250;

    return defineComponent(Notifications, withDataRequest);

    function Notifications() {

        this.attributes({
            allowSystemDismiss: true,
            animated: true,
            emptyMessage: true,
            showInformational: true,
            showUserDismissed: false,
            notificationSelector: '.notifications .notification'
        });

        this.after('initialize', function() {
            const self = this;

            if ('localStorage' in window) {
                var previouslyDismissed = localStorage.getItem('notificationsDismissed');
                if (previouslyDismissed) {
                    this.userDismissed = JSON.parse(previouslyDismissed);
                }
            }
            if (!this.userDismissed) {
                this.userDismissed = {};
            }
            this.stack = [];
            this.markRead = [];

            this.on(document, 'postLocalNotification', this.onPostLocalNotification);
            this.on(document, 'notificationActive', this.onNotificationActive);
            this.on(document, 'notificationDeleted', this.onNotificationDeleted);

            this.on('mouseover', {
                notificationSelector: this.onMouseOver
            });

            this.immediateUpdate = this.update;
            this.update = _.debounce(this.update.bind(this), 250);
            this.sendMarkRead = _.debounce(this.sendMarkRead.bind(this), 3000);

            Promise.all([
                this.dataRequest('config', 'properties'),
                this.dataRequest('notification', 'list')
            ]).done(function(result) {
                var properties = result.shift(),
                    notifications = result.shift();

                self.autoDismissSeconds = {
                    local: parseInt(properties['notifications.local.autoDismissSeconds'] || '-1'),
                    system: parseInt(properties['notifications.system.autoDismissSeconds'] || '-1'),
                    user: parseInt(properties['notifications.user.autoDismissSeconds'] || '-1')
                };
                self.displayNotifications(notifications.system.active.concat(notifications.user));
            })

            this.$container = $('<div>')
                .addClass('notifications')
                .appendTo(this.$node);

        });

        this.onPostLocalNotification = function(event, data) {
            var notification = data && data.notification;
            if (!notification) {
                throw new Error('Notification must be passed to create local notifications');
            }

            notification.type = 'local';
            notification.hash = 'local_' + new Date().getTime();
            this.displayNotifications([notification]);
        };

        this.onNotificationActive = function(event, data) {
            this.displayNotifications([data.notification]);
        };

        this.onNotificationDeleted = function(event, data) {
            this.stack = _.reject(this.stack, function(n) {
                return data.notificationId === n.id;
            });
            this.update();
            this.trigger('notificationCountUpdated', { count: this.stack.length });
        };

        this.onMouseOver = function(event, data) {
            var self = this,
                $notification = $(event.target).closest(this.attr.notificationSelector);

            clearTimeout(self.hoverTimer);
            self.hoverTimer = setTimeout(function() {
                $notification.addClass('expanded-notification');
            }, NOTIFICATION_HOVER_EXPAND_DELAY_MILLIS);

            $notification.off('mouseover', 'mouseleave').on('mouseleave', function() {
                clearTimeout(self.hoverTimer);
                $notification.removeClass('expanded-notification');
            })
        };

        this.displayNotifications = function(notifications) {
            var self = this,
                shouldDisplay = notifications && _.filter(notifications, function(n) {
                    if (n.messageType) {
                        return true;
                    }

                    if (self.attr.showUserDismissed !== true &&
                        self.userDismissed[n.id] && self.userDismissed[n.id] === n.hash) {
                        return false;
                    }

                    if (n.type === 'user') {
                        return true;
                    }

                    return self.attr.showInformational === true || n.severity !== 'INFORMATIONAL';
                });

            if (shouldDisplay && shouldDisplay.length) {
                shouldDisplay = collapseDuplicates(shouldDisplay);
                shouldDisplay.forEach(function(updated) {
                    var index = -1;
                    self.stack.forEach(function(n, i) {
                        if (n.id === updated.id) {
                            index = i;
                        }
                    });

                    if (index >= 0) {
                        self.stack.splice(index, 1, updated);
                    } else {
                        self.stack.push(updated);
                    }

                    if (self.attr.showUserDismissed !== true) {
                        var autoDismiss = self.autoDismissSeconds[updated.type];
                        if (autoDismiss > 0) {
                            _.delay(function() {
                                self.dismissNotification(updated, {
                                    markRead: false,
                                    userDismissed: true
                                });
                            }, autoDismiss * 1000);
                        }
                    }
                })
            }
            this.update();
            this.trigger('notificationCountUpdated', { count: this.stack.length });
        };

        this.setUserDismissed = function(notificationId, notificationHash) {
            this.userDismissed[notificationId] = notificationHash;
            try {
                if ('localStorage' in window) {
                    localStorage.setItem('notificationsDismissed', JSON.stringify(this.userDismissed));
                }
            } catch(e) { /*eslint no-empty:0*/ }
        };

        this.dismissNotification = function(notification, options) {
            var self = this,
                immediate = options && options.immediate,
                animate = options && options.animate,
                markRead = options && !_.isUndefined(options.markRead) ? options.markRead : true,
                userDismissed = options && !_.isUndefined(options.userDismissed) ? options.userDismissed : false;

            this.stack = _.reject(this.stack, function(n) {
                if (n.collapsedIds) {
                    return _.contains(n.collapsedIds, notification.id);
                }
                return n.id === notification.id;
            });

            if (markRead) {
                if (notification.type === 'user') {
                    if (notification.collapsedIds) {
                        notification.collapsedIds.forEach(function(nId) {
                            self.markRead.push(nId);
                        })
                    } else {
                        this.markRead.push(notification.id);
                    }
                    this.sendMarkRead();
                } else if (notification.hash) {
                    this.setUserDismissed(notification.id, notification.hash);
                } else {
                    console.warn('Notification missing hash', notification);
                }
            }

            if (userDismissed && notification.type === 'user' && notification.hash) {
                this.setUserDismissed(notification.id, notification.hash);
            }

            if (immediate) {
                this.immediateUpdate(animate);
            } else {
                this.update(animate);
            }
        };

        this.sendMarkRead = function() {
            var self = this,
                toSend = this.markRead.slice(0);

            if (!this.markReadErrorCount) {
                this.markReadErrorCount = 0;
            }

            this.markRead.length = 0;
            this.dataRequest('notification', 'markRead', toSend)
                .then(function() {
                    self.markReadErrorCount = 0;
                })
                .catch(function(error) {
                    self.markRead.splice(self.markRead.length - 1, 0, toSend);
                    if (++self.markReadErrorCount < 2) {
                        console.warn('Retrying to mark as read');
                        self.sendMarkRead();
                    }
                })
                .done();
        };

        this.onNotificationClick = function(notification) {
           if (notification.actionEvent === 'EXTERNAL_URL' &&
               notification.actionPayload &&
               notification.actionPayload.url) {
               window.open(notification.actionPayload.url);
           } else {
               _.defer(() => {
                   this.trigger(notification.actionEvent, notification.actionPayload);
               });
           }
        }

        this.update = function(forceAnimation) {
            ReactDOM.render(NotificationList({
                notifications: this.stack,
                animated: this.attr.animated || forceAnimation,
                allowSystemDismiss: this.attr.allowSystemDismiss,
                onDismissClick: this.dismissNotification.bind(this),
                onNotificationClick: this.onNotificationClick.bind(this)
            }), this.$container[0]);
        };
    }

    function collapseDuplicates(notifications) {
        var grouped = _.groupBy(notifications, 'title'),
            toAdd = [],
            toCollapseIds = [];

        _.each(grouped, function(list, title) {
            var validToCollapse = list.length > 1 && _.all(list, function(n) {
                return n.type === 'user' && !n.actionEvent && !n.actionPayload;
            });
            if (validToCollapse) {
                var ids = _.pluck(list, 'id'),
                    add = _.extend({}, list[0], {
                        collapsedIds: ids,
                        title: title + ' (' + list.length + ')',
                        message: message(list)
                    });

                toAdd.push(add);
                toCollapseIds = toCollapseIds.concat(ids);
            }
        })

        return _.chain(notifications)
            .reject(function(n) {
                return _.contains(toCollapseIds, n.id)
            })
            .tap(function(list) {
                toAdd.forEach(function(a) {
                    list.push(a);
                })
            })
            .value()

        function message(notifications) {
            var prefix = sharedPrefix(notifications);
            return (prefix || '') + _.chain(notifications)
                .map(function(n) {
                    if (prefix && prefix.length) {
                        return n.message.substring(prefix.length)
                    }
                    return n.message;
                })
                .compact()
                .sortBy(function(s) {
                    return s.toLowerCase();
                })
                .value().join(', ')
        }

        function sharedPrefix(notifications) {
            var sorted = _.pluck(notifications, 'message').sort(),
                first = _.first(sorted),
                last = _.last(sorted),
                firstLen = first.length,
                i = 0;
                if (_.isString(first) && _.isString(last)) {
                    while (i < firstLen && first.charAt(i) === last.charAt(i)) {
                        i++;
                    }
                    return first.substring(0, i);
                }
        }
    }

});
