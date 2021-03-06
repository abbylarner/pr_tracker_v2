Parse.initialize("Mte8Yv712ZgDySEst9N4Y85IZmsKECtQqcvGOKHw", "M5nmSje1x3G4rOtNVJjfOtPuG2r1hlgURvfbKvUg");


//Alert Function
function alertMessage(alertId, message, type) {
	$(alertId).html(message);
	$(alertId).addClass('alert ' + type);

	$(alertId).show();
}

//Login
function navActivate() {
	var currentUser = Parse.User.current();
	if (currentUser) {
		$('#dashboardNav, #settingsNav, #logoutNav').show();
		$('#loginNav, #registerNav').hide();
	} else {
		$('#dashboardNav, #settingsNav, #logoutNav').hide();
		$('#loginNav, #registerNav').show();
	}
}

navActivate();
logout();

//Logout 

function logout() {
	$('#logoutNav').click(function() {
		Parse.User.logOut();
		navActivate();
	});
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
function changeMetric(kgBtn, lbBtn) {
	var currentUser = Parse.User.current();

	$(kgBtn).click(function() {
		$(this).addClass('active');
		($(lbBtn).removeClass('active'));
		currentUser.save({
			weightSetting: 'kilograms'
		});
	});

	$(lbBtn).click(function() {
		$(this).addClass('active');
		($(kgBtn).removeClass('active'));
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
		"dashboard/:liftName": 'liftPage',
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
					navActivate();

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
		logout();

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
					var sameLift = _.groupBy(prResults, function(lift) {
						return lift.liftNameResult.toLowerCase();
					});

					for (var key in sameLift) {


						var liftGroups = sameLift[key];
						var maxLiftGroup = liftGroups[0];
						var maxLiftName = maxLiftGroup.liftNameResult;
						var maxLiftWeight = maxLiftGroup.liftWeightResult;
						var maxLiftMetric = currentUser.get('weightSetting');
						var maxLiftDate = maxLiftGroup.dateFormatted;
						var maxLiftId = maxLiftGroup.objectId;

						if (currentUser.get('weightSetting') === 'kilograms') {

							maxLiftWeight = parseFloat((maxLiftWeight * 100 / 100).toFixed(2));
							prItem += '<a href="#dashboard/' + maxLiftName + '" class="prItem"><h1>' + maxLiftName + '</h1><p>' + maxLiftWeight + ' ' + maxLiftMetric + '</p><p>' + maxLiftDate + '</p><button type="submit" class="btn btn-danger delete hidden">Delete</button></a>';

						} else {
							maxLiftWeight = parseFloat((maxLiftWeight * 2.2 * 100 / 100).toFixed(2));
							prItem += '<a href="#dashboard/' + maxLiftName + '" class="prItem"><h1>' + maxLiftName + '</h1><p>' + maxLiftWeight + ' ' + maxLiftMetric + '</p><p>' + maxLiftDate + '</p><button type="submit" class="btn btn-danger delete hidden">Delete</button></a>';

						}


					}

					$('#prList').html(prItem);

					$('#editButton').click(function(e) {
						e.preventDefault();

						$('.delete').toggleClass('hidden');
					});

					$('.delete').click(function(e) {
						e.preventDefault();

						var deleteId = $(this).parent('.prItem');

						if (confirm('Are you sure you would like to delete this PR?')) {
							var liftNameDestroy = $(this).parent('a').attr('href').split('/')[1];


							var PrObject = Parse.Object.extend("prObject");
							var query = new Parse.Query(PrObject);

							query.equalTo("liftName", liftNameDestroy);
							query.find({
								success: function(results) {

									for (i = 0; i < results.length; i++) {
										object = results[i];
										object.destroy({
											success: function(prObject) {
												$(deleteId).addClass('hidden');
												alertMessage('#alertMessage', 'Your PR has been deleted.', 'alert-success');
											},
											error: function(prObject, error) {
												alertMessage('#alertMessage', 'There was an error deleting your PR.', 'alert-danger');

											}
										});
									}

								},
								error: function(error) {
									alert("Error: " + error.code + " " + error.message);
								}
							});
						}

					});

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
					} else if (metric === 'pounds') {
						prObject.set('liftWeight', liftWeight / 2.2046);
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

	liftPage: function(liftName) {
		$('main section, #alertMessage').hide();
		$('#liftPage').show();
		logout();

		var currentPrName = '';
		var currentPrWeight = '';
		var currentUser = Parse.User.current();

		var PrObject = Parse.Object.extend("prObject");
		var query = new Parse.Query(PrObject);
		query.equalTo('user', currentUser);
		query.include('user');
		query.equalTo("liftName", liftName);
		query.find({
			success: function(results) {
				var weightSetting = currentUser.get('weightSetting');


				function maxLiftMain(prObject) {
					var currentPr = '';
					var maxPrObject = _.max(results, function findMax(prObject) {
						return prObject.get('liftWeight');
					});

					var maxLiftWeight = maxPrObject.get('liftWeight');
					var maxDateFormatted = convertDate(maxPrObject.get('prDate'));
					currentPrName += maxPrObject.get('liftName');
					currentPrWeight += maxPrObject.get('liftWeight');

					if (currentUser.get('weightSetting') === 'kilograms') {
						currentPr += '<h1>' + maxPrObject.get('liftName') + '</h1><h3>' + parseFloat(maxLiftWeight*100/100).toFixed(2) + ' ' + weightSetting + '</h3><p>' + maxDateFormatted + '</p>';
					} else {
						lbWeight = parseFloat((maxPrObject.get('liftWeight') * 2.2046)*100/100).toFixed(2);
						currentPr += '<h1>' + maxPrObject.get('liftName') + '</h1><h3>' + lbWeight + ' ' + weightSetting + '</h3><p>' + maxDateFormatted + '</p>';
					}

					$('#currentPr').html(currentPr);
					
				}

				maxLiftMain();


				function prList() {
					prLog = '';
					var sortDate = _.sortBy(results, function findDate(logDate) {
						return Number((logDate.get('prDate'))) * -1;
					});

					for (i = 0; i < sortDate.length; i++) {

						object = sortDate[i];
						var dateFormatted = convertDate(object.get('prDate'));

						if (currentUser.get('weightSetting') === 'kilograms') {
							prLog += '<div class="log-item"><h3>' + parseFloat(object.get('liftWeight')*100/100).toFixed(2) + ' ' + weightSetting + '</h3><p>' + dateFormatted + '</p></div>';
						} else {
							lbWeight = parseFloat((object.get('liftWeight') * 2.2046)*100/100).toFixed(2);
							prLog += '<div class="log-item"><h3>' + lbWeight + ' ' + weightSetting + '</h3><p>' + dateFormatted + '</p></div>';
						}
					}
					$('#prLog').html(prLog);
				}

				prList();


				$('#updatePrForm').submit(function(e) {
					e.preventDefault();

					var PrObject = Parse.Object.extend("prObject");
					var prObject = new PrObject();

					var newLiftName = currentPrName;
					prObject.set('liftName', currentPrName);

					var updatePrWeight = Number($('#updateLiftWeight').val());
					var metric = setMetric($('#updateKg'), $('#updateLb'));
					prObject.set('liftMetric', metric);

					var err = false;

					if (updatePrWeight === null || isNaN(updatePrWeight)) {
						alertMessage('#newPrAlert', 'Please enter a valid lift weight.', 'alert-danger');
						err = true;
					} else if (metric === 'pounds') {
						prObject.set('liftWeight', updatePrWeight / 2.2046);
					} else {
						prObject.set('liftWeight', updatePrWeight);
					}


					prObject.set('user', currentUser);
					var updatePrDate = new Date($('#updatePrDate').val());
					var timestamp = Date.parse(updatePrDate);

					if (isNaN(timestamp) === false) {
						prObject.set('prDate', updatePrDate);
					} else {
						alertMessage('#newPrAlert', 'Please enter a valid date.', 'alert-danger');
						err = true;
					}

					if (err === true) {
						alertMessage('#alertMessage', 'There was an error processing the form.', 'alert-danger');
					} else {
						prObject.save(null, {
							success: function(prObject) {
								$('#updatePr').modal('hide');


								results.push(prObject);
								prList();
								maxLiftMain();


								var dateFormatted = convertDate(prObject.get('prDate'));
								// if (updatePrWeight > currentPrWeight) {
								// 	if (currentUser.get('weightSetting') === 'kilograms') {
								// 		currentPr += '<h1>' + object.get('liftName') + '</h1><h3>' + updatePrWeight + ' ' + weightSetting + '</h3><p>' + dateFormatted + '</p>';
								// 	} else {
								// 		lbWeight = parseFloat(updatePrWeight * 2.2046);
								// 		currentPr += '<h1>' + object.get('liftName') + '</h1><h3>' + lbWeight + ' ' + weightSetting + '</h3><p>' + dateFormatted + '</p>';
								// 	}


								// }
								alertMessage('#alertMessage', 'Congrats on your new PR!', 'alert-success');
							},
							error: function(prObject, error) {
								alertMessage('#alertMessage', 'There was an error saving your PR.', 'alert-danger');
							}
						});
					}

				});

			},
			error: function(error) {
				alert("Error: " + error.code + " " + error.message);
			}
		});

	},

	settings: function() {
		$('main section, #alertMessage').hide();
		$('#settingsPage').show();
		logout();

		var currentUser = Parse.User.current();


		changeMetric('#setKg', '#setLb');

		function cb(err, prResults, userResults) {
			if (currentUser.get('weightSetting') === 'kilograms') {
				$('#setKg').addClass('active');
				$('#setLb').removeClass('active');
			} else {
				$('#setKg').removeClass('active');
				$('#setLb').addClass('active');
			}

		}

		queryPrObject(cb);

	}

});

var router = new Router();

Backbone.history.start();