Parse.initialize("Mte8Yv712ZgDySEst9N4Y85IZmsKECtQqcvGOKHw", "M5nmSje1x3G4rOtNVJjfOtPuG2r1hlgURvfbKvUg");

//Alert Function
function alertMessage(alertId, message, type) {
	$(alertId).html(message);
	$(alertId).addClass('alert ' + type);

	$(alertId).show();
}


//Check Weight Metric
function setMetric(kgBtn, lbBtn) {
	var kiloInput = $(kgBtn);
	var lbInput = $(lbBtn);

	if (kiloInput.hasClass('active')) {
		return 'kilograms';
	} else {
		return 'pounds';
	}
}

//Change Metric 
function changeMetric(kgBtn, lbBtn){
	var currentUser = Parse.User.current();

	$(kgBtn).click(function(){
		$(this).addClass('active');
		($(lbBtn).remove('active'));
		currentUser.save({
			weightSetting: 'kilograms'
		});
	});

	$(lbBtn).click(function(){
		$(this).addClass('active');
		($(kgBtn).remove('active'));
		currentUser.save({
			weightSetting: 'pounds'
		});
	});
}

//Function convert date
function convertDate(prDateResult) {
	var day = prDateResult.getUTCDate();
	var allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var month = allMonths[prDateResult.getUTCMonth()];
	var year = prDateResult.getUTCFullYear();
	return month + ' ' + day + ', ' + year;
}

//Function query prObject

function queryPrObject(callback) {
	var prResults = [];
	var userResults = '';
	var PrObject = Parse.Object.extend("prObject");
	var prObject = new PrObject();
	var currentUser = Parse.User.current();

	if (currentUser) {
		var query = new Parse.Query(PrObject);
		query.descending("liftWeight");
		query.equalTo('user', currentUser);
		query.include('user');
		var prItem = '';

		query.find({
			success: function(results) {
				for (var i = 0; i < results.length; i++) {
					var object = results[i];
					var liftNameResult = object.get('liftName');
					var liftWeightResult = object.get('liftWeight');
					var liftMetricResult = object.get('liftMetric');
					var prDateResult = object.get('prDate');
					var weightSetting = object.get('user').get('weightSetting');
					var dateFormatted = convertDate(prDateResult);
					prResults.push({
						liftNameResult: liftNameResult,
						liftWeightResult: liftWeightResult,
						liftMetricResult: liftMetricResult,
						dateFormatted: dateFormatted,
						objectId: object.id
					});
				}

				
				userResults = weightSetting;

				callback(null, prResults, userResults);

			},
			error: function(error) {
				callback('There was an error retrieving results.', prResults, userResults);
			}
		});
	}
}

var Router = Backbone.Router.extend({

	routes: {
		login: 'login',
		register: 'register',
		dashboard: 'dashboard',
		"dashboard/:page": 'liftPage',
		settings: 'settings',
	},

	login: function() {
		$('main section, #alertMessage').hide();
		$('#loginPage').show();

		$('#loginPage form').submit(function(e) {
			e.preventDefault();

			var username = $('#loginEmail').val();
			var password = $('#loginPassword').val();

			Parse.User.logIn(username, password, {
				success: function(user) {
					router.navigate('dashboard', {
						trigger: true
					});
				},
				error: function(user, error) {
					alertMessage('#alertMessage', 'There was an error logging in.', 'alert-danger');
				}
			});
		});
	},

	register: function() {
		$('main section, #alertMessage').hide();
		$('#registerPage').show();

		$('#registerPage form').submit(function(e) {
			e.preventDefault();

			var user = new Parse.User();
			user.set("username", $('#registerEmail').val());
			user.set("password", $('#registerPassword').val());
			user.set("email", $('#registerEmail').val());
			user.set("weightSetting", 'kilograms');

			user.signUp(null, {
				success: function(user) {
					router.navigate('dashboard', {
						trigger: true
					});
				},
				error: function(user, error) {
					alertMessage('#alertMessage', 'There was an error signing  up.', 'alert-danger');
				}
			});
		});
	},

	dashboard: function() {
		$('main section, #alertMessage').hide();
		$('#dashboardPage').show();

		//Get PR List
		function getPrList() {
			var PrObject = Parse.Object.extend("prObject");
			var prObject = new PrObject();
			var currentUser = Parse.User.current();

			if (currentUser) {

				function cb(err, prResults, userResults) {
					var metric = '';
					var prItem = '';
					var sameLift = _.groupBy(results, function(lift) {
						return lift.liftNameResult.toLowerCase();
					});
					for (var key in sameLift) {


						var liftGroups = sameLift[key];
						var maxLiftGroup = liftGroups[0];
						var maxLiftName = maxLiftGroup.liftNameResult;
						var maxLiftWeight = maxLiftGroup.liftWeightResult;
						var maxLiftMetric = maxLiftGroup.liftMetricResult;
						var maxLiftDate = maxLiftGroup.dateFormatted;
						var maxLiftId = maxLiftGroup.objectId;

						// if (object.get('user').get('weightSetting') === 'kilograms') {
						// 	metric = 'Kg';
						// } else {
						// 	metric = 'Lbs';
						// }

						prItem += '<a href="#dashboard/' + maxLiftId + '" class="prItem"><h1>' + maxLiftName + '</h1><p>' + maxLiftWeight + ' ' + maxLiftMetric + '</p><p>' + maxLiftDate + '</p></a>';

					}

					$('#prList').html(prItem);

				}

				queryPrObject(cb);

			} else {
				alertMessage('#alertMessage', 'There was an error getting your PR\'s', 'alert-danger');
			}
		}

		getPrList();

		//Add New PR
		$('#newPrForm').submit(function(e) {
			e.preventDefault();

			var PrObject = Parse.Object.extend("prObject");
			var prObject = new PrObject();
			var err = false;
			var match = false;
			var currentUser = Parse.User.current();
			var query = new Parse.Query(PrObject);
			query.equalTo('user', currentUser);
			query.include('user');
			var prItem = '';

			query.find({
				success: function(results) {
					var newLiftName = $('#newLiftName').val().toLowerCase();
					prObject.set('liftName', newLiftName);

					var metric = setMetric($('#newKg'), $('#newLb'));
					prObject.set('liftMetric', metric);

					var liftWeight = Number($('#newliftWeight').val());
					if (liftWeight === null || isNaN(liftWeight)) {
						alertMessage('#newPrAlert', 'Please enter a valid lift weight.', 'alert-danger');
						err = true;
					} else {
						prObject.set('liftWeight', liftWeight);
					}

					var prDate = new Date($('#newPrDate').val());
					var timestamp = Date.parse(prDate);

					if (isNaN(timestamp) === false) {
						prObject.set('prDate', prDate);
					} else {
						alertMessage('#newPrAlert', 'Please enter a valid date.', 'alert-danger');
						err = true;
					}

					prObject.set('user', currentUser);

					if (err === true) {
						alertMessage('#alertMessage', 'There was an error processing the form.', 'alert-danger');
					} else {
						prObject.save(null, {
							success: function(prObject) {
								$('#newPr').modal('hide');
								getPrList();
								alertMessage('#alertMessage', 'Congrats on your new PR!', 'alert-success');
							},
							error: function(prObject, error) {
								alertMessage('#alertMessage', 'There was an error saving your PR.', 'alert-danger');
							}
						});
					}
				},
				error: function(error) {}
			});
		});
	},

	liftPage: function(page) {
		$('main section, #alertMessage').hide();
		$('#liftPage').show();

		function cb(err, prResults, userResults) {
			var hashId = window.location.hash.split('/')[1];
			var currentPr = '';

			for (i = 0; i < results.length; i++) {
				object = results[i];
				if (object.objectId === hashId) {
					$('#liftPageTitle').html(object.liftNameResult);
					currentPr += '<h3>' + object.liftWeightResult + '</h3><p>' + object.dateFormatted + '</p>';
				}
			}
			$('#currentPr').html(currentPr);
		}

		queryPrObject(cb);

	},

	settings: function() {
		$('main section, #alertMessage').hide();
		$('#settingsPage').show();

		var metricSetting = changeMetric('#setKg', '#setLb');
		console.log(metricSetting);

	}

});

var router = new Router();

Backbone.history.start();