(function($){
	$(function(){

		pyro.clear_notifications = function(){
			$('.notification .close').click();
			return pyro;
		};
		pyro.add_notification = function(notification, append){
			if ( ! append)
			{
				pyro.clear_notifications();
			}
			$('#shortcuts').after(notification);
			return pyro;
		};
		pyro.attachments = {
			$list			: $('#attachments-list'),
			$empty			: $('#attachments-list > li.empty'),
			$attachments	: $('#attachments-list > li:not(.tmpl, .empty)'),

			file_browser: {
				$container	: $('#file-browser-files > .container'),
				$contents	: $('#file-browser-files select'),

				file		: {
					$preview	: $('#file-browser-files > .file_preview'),
					$image		: $('<img/>')
				},

				url			: BASE_URI + 'admin/files/attachments/file_browser/contents/'
			},

			tmpl: {
				file_browser_item: '',
				attachment_item: ''
			},

			init: function(){

				pyro.attachments.tmpl.attachment_item = $('<div />')
					.html(
						pyro.attachments.$list
							.children('.tmpl')
							.hide()
							.removeClass('tmpl')
					).html();

				pyro.attachments.tmpl.file_browser_item = $('<div />')
					.html(
						pyro.attachments.file_browser.$container
							.find('select option.tmpl')
							.removeClass('tmpl')
					).html();

				// TYPE FILE BROWSER ---------------------------------------------------------------

				$('select#file-browser-folders').bind('change keyup', $.debounce(350, function(e){
					var select	= $(this),
						jqxhr	= null,
						id		= select.val(),
						url		= pyro.attachments.file_browser.url + id;

					pyro.attachments.file_browser.$contents
						.find('option:not(:first)')
						.remove();

					$.uniform.update(pyro.attachments.file_browser.$contents
						.change().attr('disabled', true));

					if ( ! id)
					{
						pyro.attachments.file_browser.file.$preview.removeClass('unlock').addClass('lock');

						return;
					}

					pyro.attachments.file_browser.file.$preview.addClass('loading');

					jqxhr = $.get(url, function(response){

						if (response && response.status == 'success')
						{
							var opts = '',
								file = {
									id: 0,
									name: '',
									type: '',
									source: '',
									thumb: ''
								};

							for (i in response.files)
							{
								file = response.files[i];
								opts += pyro.attachments.tmpl.file_browser_item
									.replace(/\{id\}/g, file.id)
									.replace(/\{name\}/g, file.name)
									.replace(/\{type\}/g, file.type)
									.replace(/\{source\}/g, file.source)
									.replace(/\{thumb\}/g, file.thumb);
							}

							if (opts)
							{
								$.uniform.update(pyro.attachments.file_browser.$contents
									.append($(opts))
									.removeAttr('disabled'));

								pyro.attachments.file_browser.file.$preview.removeClass('lock').addClass('unlock');
							}
							else
							{
								pyro.attachments.file_browser.file.$preview.removeClass('unlock').addClass('lock');
							}
						}

						else if (response && response.status == 'error')
						{
							pyro.add_notification(response.message);
						}

						pyro.attachments.file_browser.file.$preview.removeClass('loading');
					}, 'json');
				})).change();

				// Toggle file preview
				pyro.attachments.file_browser.$contents.bind('change keyup', $.debounce(350, function(e){
					var self = $(this),
						option = $('option:selected,option[value="'+self.val()+'"]', this),
						file = {
							id: self.val(),
							name: option.text(),
							type: option.attr('data-type'),
							source: option.attr('data-source'),
							thumb: option.attr('data-thumb')
						};

					if ( ! file.id)
					{
						pyro.attachments.file_browser.file.$preview.empty();

						return;
					}

					pyro.attachments.file_browser.file.$preview.fadeOut(50, function(){
						$(this).empty().addClass('loading');

						pyro.attachments.file_browser.file.$image.load(function(){

							// Show file preview
							pyro.attachments.file_browser.file.$preview
								.removeClass('loading')
								.html(pyro.attachments.file_browser.file.$image)
								.wrapInner(
									'<a href="' + file.source +
									'" style="background-image: url(' + file.thumb + ');" />'
								).filter(function(){
									$('a', this).colorbox({
										scrolling: false,
										maxWidth: '80%',
										maxHeight: '80%'
									}).data('colorbox');
									return true;
								}).fadeIn('slow');

						}).attr('src', file.thumb);
					});
				})).change();

				$('#attachment-file-browser .button.attach').click(function(e){
					e.preventDefault();

					var button	= $(this),
						url		= button.attr('href'),
						data	= {
							attachments_key	: attachments_key,
							file_id : $('select[name=attachment_file_contents]').val()
						}

					$.post(url, data, function(data){
						if (data && data.status == 'success')
						{
							pyro.add_notification(data.message)
								.attachments.add_attachment(data.attachment);
						}
						else if (data && data.status == 'error')
						{
							pyro.add_notification(data.message);
						}
					}, 'json');
				});

				// TYPE LINK -----------------------------------------------------------------------

				var attachments_key = $('input[name=attachments_key]').val();

				$('input[value="http://"]')
					.data('default_value', 'http://')
					.bind('keyup blur', $.debounce(350, function(e){

					var self = $(this);

					if (e.type == 'blur' && ! self.val().length)
					{
						self.val(self.data('default_value'));
					}
					else if (e.type == 'blur' || self.val().length > 11)
					{
						self[((self.val().indexOf('://') == -1) ? 'add' : 'remove')+'Class']('error');
					}
				}));

				$('#attachment-link .button.attach').click(function(e){
					e.preventDefault();

					var button	= $(this),
						url		= button.attr('href'),
						prefix	= 'input[name=attachment_link_',
						data	= {
							attachments_key	: attachments_key,
							link_url		: $(prefix + 'url]').val(),
							link_title		: $(prefix + 'title]').val(),
							link_class		: $(prefix + 'class]').val()
						}

					$.post(url, data, function(data){
						if (data && data.status == 'success')
						{
							pyro.add_notification(data.message)
								.attachments.add_attachment(data.attachment);
						}
						else if (data && data.status == 'error')
						{
							pyro.add_notification(data.message);
						}
					}, 'json');
				});

				// TYPE CHANGE ---------------------------------------------------------------------

				// Pick a rule type, show the correct field
				$('input[name=attachment_type]').change(function(){
					$('#attachment-' + $(this).val())

					// Show only the selected type
					.show().siblings().hide()

					// Reset values when switched
					.find(':input:not([value="http://"])').each(function(){
						var field = $(this).val('');
						if (field.is('select'))
						{
							field.change();
						}
					});

				// Trigger default checked
				}).filter(':checked').change();
			},

			add_attachment: function(data){
				var attachment = pyro.attachments.tmpl.attachment_item
					.replace(/\{id\}/g, data.id)
					.replace(/\{title\}/g, data.title)
					.replace(/\{type\}/g, data.type),

				$attachemnt = $(attachment)
					.appendTo(pyro.attachments.$list);

				pyro.attachments.$attachments.add($attachemnt);

				if (pyro.attachments.$empty.is(':hidden'))
				{
					$attachemnt.fadeIn('fast');
				}
				else
				{
					pyro.attachments.$empty
						.fadeOut()
						.slideUp(function(){
							$attachemnt.fadeIn('fast');
						});
				}

				return pyro.attachments;
			}
		};
		pyro.attachments.init();
	});
})(jQuery);