const Cyrilex = {
	construct: function() {
		RegexHighlight.construct();
		Cyrilex.highlight= RegexHighlight;
		Cyrilex.start= '/';
		Cyrilex.end= '/g';
		Cyrilex.engineArray= ['js'/*, 'pcre', 'python', 'ruby', 'java'*/];
		Cyrilex.extensionByEngine= [];
		Cyrilex.extensionByEngine['js']= '';
		/*Cyrilex.extensionByEngine['pcre'] = myDomain + "/pcre.php";
		Cyrilex.extensionByEngine['python'] = myDomain + "/pcre.cgi";
		Cyrilex.extensionByEngine['ruby'] = myDomain + "/pcre.ruby.php";
		Cyrilex.extensionByEngine['java'] = myDomainAPI + '/regex-tester/pcre.java';*/
		Cyrilex.flags= ['g', 'i', 'm', 'u', 'y', 's', 'x', 'A', 'D', 'S', 'U', 'X', 'J', 'l', 'c', 'L', 'C'];
		Cyrilex.flagsByEngine= [];
		Cyrilex.flagsByEngine['js']= ['g', 'i', 'm', 'u', 'y', 's'];
		/*Cyrilex.flagsByEngine['pcre'] = ['g', 'i', 'm', 'u', 's', 'x', 'A', 'D', 'S', 'U', 'X', 'J'];
		Cyrilex.flagsByEngine['python'] = ['g' /* findall ... * /, 'i' /* IGNORECASE, I * /, 'm' /* MULTILINE, M * /, 'u' /* UNICODE, U * /, 's' /* DOTALL, S * /, 'x' /* VERBOSE, X * /]; /*, 'l'  LOCALE, L * /
		Cyrilex.flagsByEngine['ruby'] = ['g', 'i', 'm', 'x'];
		Cyrilex.flagsByEngine['java'] = ['g', 'i', 'x', 's', 'm', 'u', 'l', 'c', 'L', 'C'];*/	
		Cyrilex.markersString= [];
		Cyrilex.myCodeMirrorString= null;
		Cyrilex.myCodeMirrorRegEx= null;
		Cyrilex.myCodeMirrorSubstitution= null;
		Cyrilex.myCodeMirrorSubstitutionResult= null;
		Cyrilex.markLeft= null;
		Cyrilex.markRight= null;
		
		// regulex
		Cyrilex.visualize= null;
		Cyrilex.parse= null;
		Cyrilex.paper= null;
	},
	displayResultExplanation: function(result) {
		const container = document.createElement('div');
		container.style.marginLeft = '10px';
		container.appendChild(result.getTitle());
		// container.appendChild(document.createTextNode(result.tag));
		// container.appendChild(document.createTextNode(result.label));
		if (result.regexp) {
			result.regexp.result.forEach(function (result) {
				container.appendChild(Cyrilex.displayResultExplanation(result));
			});
		}
		if (result.result) {
			result.result.forEach(function (subresult) {
				if (subresult.section) {
					const subcontainer = document.createElement('div');
					subcontainer.style.marginLeft = '10px';
					container.appendChild(subcontainer);
					subcontainer.appendChild(document.createTextNode(subresult.section));
					subcontainer.appendChild(document.createElement('br'));
					subcontainer.appendChild(Cyrilex.displayResultExplanation(subresult));
				} else {
					container.appendChild(Cyrilex.displayResultExplanation(subresult));
				}
			});	
		}
		return container;
	},
	displayExplanation: function(explanation) {
		Cyrilex.highlight.highlight(Cyrilex.myCodeMirrorRegEx, explanation, {pos: 1, color: 0});
		return Cyrilex.visualIt(explanation);
	},
	visualIt: function(re) {
		const self = this;
		if (!re) return false;
		if (Cyrilex.parse == null) {
			setTimeout(function () {
				self.visualIt(re);
			}, 10);
			return;
		}
		try {
			const ret = Cyrilex.parse(re.regExStr)
			Cyrilex.visualize(ret,re.regExFlags, Cyrilex.paper);
		}
		catch (e) {
			if (e instanceof Cyrilex.parse.RegexSyntaxError) {
				return Cyrilex.logError(re.regExStr, e);
			} else {
				Cyrilex.setAndDisplay('editor-error', 'Syntax error in your regular expression');
			}
		}
	},
	getEngine: function() {
		return Cyrilex.engineArray.reduce(function (arg_result, arg_engine) {
			if (document.getElementById('engine-' + arg_engine).checked) {
				return arg_engine;
			}
			return arg_result;
		});	
	},
	updateFlags: function() {
		const self = this;
		if (Cyrilex.markRight) Cyrilex.markRight.clear();
		if (Cyrilex.markLeft) Cyrilex.markLeft.clear();

		let current = Cyrilex.myCodeMirrorRegEx.getValue();
		current = current.substring(0, current.length - Cyrilex.end.length);

		Cyrilex.end = "/";
		const engine = Cyrilex.getEngine();
		Cyrilex.flagsByEngine[engine].forEach(function (f) {
			if (document.getElementById('flag_' + f).checked) self.end += f;
		});

		Cyrilex.myCodeMirrorRegEx.setValue(current + Cyrilex.end);

		Cyrilex.markLeft = Cyrilex.myCodeMirrorRegEx.markText({line: 0, ch: 0}, {line: 0, ch: 1}, {readOnly: true, atomic: true, inclusiveLeft: true});		
		Cyrilex.markRight = Cyrilex.myCodeMirrorRegEx.markText({line: 0, ch: Cyrilex.myCodeMirrorRegEx.getValue().length - Cyrilex.end.length}, {line: 0, ch: Cyrilex.myCodeMirrorRegEx.getValue().length + 1}, {readOnly: true, atomic: true, inclusiveRight: true});	
		Cyrilex.checkRegEx();
	},
	analyzeMatch: function(matchArray, infinity) {
		const self = this;
		if (infinity) {
			Cyrilex.setAndDisplay('editor-valid', 'infinity of matchs');
		} else if (matchArray == null || matchArray.length == 0) {
			Cyrilex.setAndDisplay('editor-error', 'No match');
		} else {
			Cyrilex.setAndDisplay('editor-valid', matchArray.length+' matchs');
			matchArray.forEach(function (match, indexMark) {
				var before = self.myCodeMirrorString.getValue("\n").substring(0, match.index).split("\n");
				var find = match.m.split("\n");
				self.markersString.push(self.myCodeMirrorString.markText(
						{line: before.length - 1, ch: before[before.length-1].length}, 
						{line: before.length - 1 + find.length - 1, ch: (find.length == 1 ? before[before.length-1].length + find[0].length: find[find.length-1].length) }, 
						{className: "regExMatch" + (indexMark % 2)}
					)
				);	
			});
		}
	},
	checkRegExJS: function(pattern, subject) {
		Cyrilex.emptyAndHide(['editor-error', 'editor-valid']);
		var regex = new RegExp( pattern , Cyrilex.end.substring(1));
		var m = null;
		var previous = -1;
		var matchArray = [];
		var infinity = false;
		while ((m = regex.exec(subject)) !== null) {
			matchArray.push({index: m.index, m: m[0]});
			if (Cyrilex.end.indexOf('g') === -1) {
				break;
			}
			if (previous == m.index) {
				infinity = true;
				break;
			}
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}
			previous = m.index;
		}
		Cyrilex.analyzeMatch(matchArray, infinity);

		Cyrilex.myCodeMirrorSubstitutionResult.setValue(Cyrilex.myCodeMirrorString.getValue("\n").replace(regex, Cyrilex.myCodeMirrorSubstitution.getValue("\n")));
	},
	checkRegEx: function() {
		const engine = Cyrilex.getEngine();
		try {
			var editor = Cyrilex.myCodeMirrorRegEx.getValue("\n");

			Cyrilex.markersString.forEach(function(marker) { marker.clear(); });
			Cyrilex.markersString.splice(0, Cyrilex.markersString.length)

			if (editor.substring(Cyrilex.start.length, editor.length - Cyrilex.end.length) == '') {
				Cyrilex.emptyAndHide(['editor-error', 'editor-valid']);
				Cyrilex.setAndDisplay('editor-valid', 'Enter your regular expression.');
			} else {
				let explanation = (new RegexExplanation()).explain(editor.substring(Cyrilex.start.length, editor.length - Cyrilex.end.length));
				explanation.regExStr = editor.substring(Cyrilex.start.length, editor.length - Cyrilex.end.length);
				explanation.regExFlags = Cyrilex.end.substring(1);
				const errorMsg = Cyrilex.displayExplanation(explanation);
				//if (engine == 'js') {
					Cyrilex.checkRegExJS(editor.substring(Cyrilex.start.length, editor.length - Cyrilex.end.length), Cyrilex.myCodeMirrorString.getValue("\n"));
				/*} else {
					checkRegExPRE(editor.substring(start.length, editor.length - end.length), Cyrilex.myCodeMirrorString.getValue("\n"), Cyrilex.start, Cyrilex.end, errorMsg);
				}*/
			}
		} catch(e) {
			if (e.message) {
				Cyrilex.setAndDisplay('editor-error', e.message);
			} else {
				Cyrilex.setAndDisplay('editor-error', 'Invalid regular expression');	
			}
		}
	},
	manageFlags: function() {
		const engine = Cyrilex.getEngine();
		Cyrilex.flags.forEach(function (f) {
			document.getElementById('flag_' + f).parentNode.parentNode.style.display = 'none';
		});
		Cyrilex.flagsByEngine[engine].forEach(function (f) {
			document.getElementById('flag_' + f).parentNode.parentNode.style.display = '';
		});	
	},
	clearSelect: function() {
	  if (window.getSelection) {
		if (window.getSelection().empty) {  // Chrome
		  window.getSelection().empty();
		} else if (window.getSelection().removeAllRanges) {  // Firefox
		  window.getSelection().removeAllRanges();
		}
	  } else if (document.selection) {  // IE
		document.selection.empty();
	  }
	},
	openTabber: function(tabber, className, selector) {
		if (!className) {
			className = 'w3-dark-grey';
		}
		var i;
		var x;
		if (!selector) {
			x = document.getElementsByClassName("tabber");
		} else {
			x = document.querySelectorAll(selector);
		}
		
		for (i = 0; i < x.length; i++) {
			x[i].style.display = "none"; 
			if (document.getElementById('button-'+x[i].id)) document.getElementById('button-'+x[i].id).classList.remove(className);
		}
		document.getElementById(tabber).style.display = "block"; 
		if (document.getElementById('button-'+tabber)) document.getElementById('button-'+tabber).classList.add(className);
	},
	logError: function(re, err) {
	  var msg=["Error:"+err.message,""];
	  if (typeof err.lastIndex==='number') {
		msg.push(re);
		msg.push(new Array(err.lastIndex).join('-')+"^");
	  }
	  return "Syntax error in your regular expression\n"+msg.join("\n");
	},
	emptyAndHide: function(containerId) {
		const self = this;
		if (containerId instanceof Array) {
			containerId.forEach(function(id) {
				self.emptyAndHide(id);
			});
		} else {
			var containerError = (typeof containerId === 'string' ? document.getElementById(containerId) : containerId);
			if (containerError) {
				containerError.innerText = '';
				containerError.style.display = 'none';
			}
		}
	},
	setAndDisplay: function(containerId, messageText) {
		var containerError = (typeof containerId === 'string' ? document.getElementById(containerId) : containerId);
		if (containerError && messageText) {
			containerError.innerText = messageText;
			containerError.style.display = '';
		}
	},
	initRegEx: function() {
		Cyrilex.myCodeMirrorSubstitution.setValue('Regular expression');
		Cyrilex.myCodeMirrorString.setValue('Online XPath tester');
		Cyrilex.myCodeMirrorRegEx.setValue('/(XP[a-z]th)|(JSONPath)/g');	
	},
	generateString: function() {
		try {
			const pattern = Cyrilex.myCodeMirrorRegEx.getValue("\n").substring(Cyrilex.start.length, Cyrilex.myCodeMirrorRegEx.getValue("\n").length - Cyrilex.end.length);
			Cyrilex.myCodeMirrorString.setValue(new RandExp(new RegExp( pattern , Cyrilex.end.substring(1))).gen());
		} catch(e) {
			Cyrilex.setAndDisplay('editor-error', 'An error has occured: ' + e.message);
		}
	},
	init: function() {
		const self = this;

		require(['external/regulex/src/libs/raphael','external/regulex/src/visualize','external/regulex/src/parse'],function (R,_visualize,_parse) {
			self.visualize = _visualize;
			self.parse = _parse;
			self.paper = R('graphCt', 10, 10);
		});

		Cyrilex.myCodeMirrorSubstitution = CodeMirror.fromTextArea(document.getElementById('editor-container-substitution'), { lineNumbers: true, viewportMargin: Infinity});
		Cyrilex.myCodeMirrorSubstitution.setSize(null, 42);
		Cyrilex.myCodeMirrorSubstitution.on( "change", Cyrilex.checkRegEx.bind(this));
		
		Cyrilex.myCodeMirrorSubstitutionResult = CodeMirror.fromTextArea(document.getElementById('editor-container-substitution-result'), { lineNumbers: true, readOnly: true, lineWrapping: true, viewportMargin: Infinity});
		Cyrilex.myCodeMirrorSubstitutionResult.setSize(null, 160);

		Cyrilex.myCodeMirrorString = CodeMirror.fromTextArea(document.getElementById('editor-container'), { lineNumbers: true, lineWrapping: true,viewportMargin: Infinity});
		Cyrilex.myCodeMirrorString.setSize(null, 160);
		Cyrilex.myCodeMirrorString.on( "change", Cyrilex.checkRegEx.bind(this));
		
		Cyrilex.myCodeMirrorRegEx = CodeMirror.fromTextArea(document.getElementById('editor-container-regexp'), { lineNumbers: false, viewportMargin: Infinity});
		Cyrilex.myCodeMirrorRegEx.on( "change", Cyrilex.checkRegEx.bind(this));
		Cyrilex.myCodeMirrorRegEx.setSize(null, 42);
		
		Cyrilex.myCodeMirrorRegEx.on( "beforeChange", function(cm, change) { 
			if (change.text && change.text.length > 1) 
			{ 
				change.update(change.from, change.to, [ change.text.join("") ]); 
			} 
		}, this); 			
		
		Cyrilex.flags.forEach(function (f) {
			document.getElementById('flag_' + f).addEventListener('change', function(e) { 
				 Cyrilex.updateFlags();
			}, false); 			
		});

		Cyrilex.engineArray.forEach(function (engine) {
			const self = this;
			document.getElementById('engine-' + engine).addEventListener('change', function(e) { 
				Cyrilex.manageFlags();
				Cyrilex.updateFlags();
				Cyrilex.checkRegEx();
				if (document.URL.split('#').length == 1 || Cyrilex.engineArray.indexOf(document.URL.split('#')[1]) !== -1) {
					if (document.URL.indexOf('/regex/') === -1) {
						history.pushState({}, "", window.location.pathname + "#"+Cyrilex.getEngine());
					}
				}
			}, false);
		});
		
		Cyrilex.emptyAndHide(['editor-error', 'editor-valid']);

		Cyrilex.markLeft = Cyrilex.myCodeMirrorRegEx.markText({line: 0, ch: 0}, {line: 0, ch: 1}, {atomic: true, inclusiveLeft: true});
		Cyrilex.markRight = Cyrilex.myCodeMirrorRegEx.markText({line: 0, ch: Cyrilex.myCodeMirrorRegEx.getValue().length - Cyrilex.end.length }, {line: 0, ch: Cyrilex.myCodeMirrorRegEx.getValue().length + 1 }, {readOnly: true, atomic: true, inclusiveRight: true});
		
		Cyrilex.manageFlags();
		Cyrilex.updateFlags();

		Cyrilex.highlight.init();
		Cyrilex.initRegEx(); 
				
		const  coll = document.getElementsByClassName("collapsible");
		for (let i = 0; i < coll.length; i++) {
		  coll[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var content = this.nextElementSibling;
			if (content.style.display === "block") {
			  content.style.display = "none";
			} else {
			  content.style.display = "block";
			}
		  });
		}
	}
}
