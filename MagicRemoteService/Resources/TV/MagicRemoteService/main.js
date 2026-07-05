
ArrayBuffer.prototype.toString = function(base) {
	return Array.prototype.slice.call(new Uint8Array(this)).map(function(x) {
		return ("00" + x.toString(base)).slice(-2);
	}).join("");
};

Window.prototype.oneEventListener = function(strType, fListener) {
	function Handler(inEvent) {
		this.removeEventListener(strType, Handler);
			if(fListener(inEvent) === false) {
			this.addEventListener(strType, Handler);
		}
	}
	this.addEventListener(strType, Handler);
};
Element.prototype.oneEventListener = Window.prototype.oneEventListener;
Document.prototype.oneEventListener = Window.prototype.oneEventListener;

Object.prototype.spread = function(o) {
	for(var strProperty in this) {
		if(strProperty in o) {
			this[strProperty] = o[strProperty];
		}
	}
};

Object.prototype.toString = function() {
	const arrAncestor = [];
	return JSON.stringify(this, function(k, o) {
		if(typeof o !== "object" || o === null) {
			return o;
		} else {
			while(arrAncestor.length > 0 && arrAncestor[arrAncestor.length - 1] !== this) {
				arrAncestor.pop();
			}
			if(arrAncestor.indexOf(o) !== -1 ) {
				return "[Circular]";
			}
			arrAncestor.push(o);
			return o;
		}
	});
};

function startInterval(callback, ms) {
	callback();
	return setInterval(callback, ms);
}

function readJson(fCallback, strPath) {
	var xhr = new XMLHttpRequest();
	xhr.onload = function(e) {
		fCallback(JSON.parse(xhr.responseText));
	};
	xhr.onerror = function(e) {
		fCallback();
	};
	xhr.open("GET", strPath, true);
	xhr.send(null);
}

const bDebug = false;

const MessageType = {
	PositionRelative: 0x00,
	PositionAbsolute: 0x01,
	Wheel: 0x02,
	Visible: 0x03,
	Key: 0x04,
	Unicode: 0x05,
	Shutdown: 0x06
}

const uiRemoteEvent = 200;
const strAppId = "com.cathwyler.magicremoteservice";
const aSensor = {
	dFactor: 50,
	dSpeed: 9,
}

// Each HDMI input the user configures gets its own PC connection profile,
// picked at runtime (see ProfilesLoad/ActivateProfile) instead of being
// baked into the build like the old per-input packaged installs were.
const arrInputList = [
	{ inputId: "HDMI_1", inputAppId: "com.webos.app.hdmi1", inputName: "HDMI 1" },
	{ inputId: "HDMI_2", inputAppId: "com.webos.app.hdmi2", inputName: "HDMI 2" },
	{ inputId: "HDMI_3", inputAppId: "com.webos.app.hdmi3", inputName: "HDMI 3" },
	{ inputId: "HDMI_4", inputAppId: "com.webos.app.hdmi4", inputName: "HDMI 4" }
];
var pActive = null;

const strPath = webOS.fetchAppRootPath();
var arrVersion = null;
var oString = null;

var deKeyboard = document.getElementById("keyboard");
var deVideo = document.getElementById("video");

var deScreenToast = null;
function Toast(strTitle, strMessage) {
	if(ScreenExist(deScreenToast)) {
		ScreenCancel(deScreenToast, false);
	}
	deScreenToast = document.createElement("div");
	deScreenToast.className = "screen flex justify-center align-flex-end";
	var deToast = document.createElement("div");
	deToast.className = "window toast";
	deToast.addEventListener("click", function() {
		ScreenCancel(deScreenToast, false);
	});
	if(strTitle.length) {
		var dePopupTitle = document.createElement("div");
		dePopupTitle.className = "title";
		dePopupTitle.innerText = strTitle;
		deToast.appendChild(dePopupTitle);
	}
	if(strMessage.length) {
		var dePopupMessage = document.createElement("div");
		dePopupMessage.className = "message";
		dePopupMessage.innerText = strMessage;
		deToast.appendChild(dePopupMessage);
	}
	deScreenToast.appendChild(deToast);
	document.body.appendChild(deScreenToast);
}

function Dialog(strTitle, strMessage, arrButton) {
	CursorShowCountIf0();
	var deScreenDialog = document.createElement("div");
	deScreenDialog.className = "screen flex justify-center align-center";
	var deDialog = document.createElement("div");
	deDialog.className = "window dialog";
	if(strTitle.length) {
		var dePopupTitle = document.createElement("div");
		dePopupTitle.className = "title";
		dePopupTitle.innerText = strTitle;
		deDialog.appendChild(dePopupTitle);
	}
	if(strMessage.length) {
		var dePopupMessage = document.createElement("div");
		dePopupMessage.className = "message";
		dePopupMessage.innerText = strMessage;
		deDialog.appendChild(dePopupMessage);
	}
	if(arrButton.length) {
		var dePopupButton = document.createElement("div");
		dePopupButton.className = "button flex justify-flex-end align-center";
		arrButton.forEach(function(bButton) {
			var deButton = document.createElement("button");
			deButton.innerText = bButton.strName;
			deButton.addEventListener("click", function() {
				ScreenCancel(deScreenDialog);
			});
			deButton.addEventListener("click", bButton.fAction);
			dePopupButton.appendChild(deButton);
		});
		deDialog.appendChild(dePopupButton);
	}
	deScreenDialog.appendChild(deDialog);
	document.body.appendChild(deScreenDialog);
	return deScreenDialog;
}

function ScreenExist(deScreen) {
	return deScreen !== null && deScreen.parentNode !== null;
}

function ScreenCancel(deScreen, bCursor) {
	document.body.removeChild(deScreen);
	if(bCursor === undefined || bCursor === true) {
		CursorHideCountIf0();
	}
}

function Log() {
	console.log.apply(console, arguments);
	Toast(oString.strLogTitle, Array.prototype.slice.call(arguments).map(function(x) {
		if(typeof o !== "object" || o === null) {
			return x;
		} else {
			return x.toString();
		}
	}).join(""));
}

function LogIfDebug() {};
if(bDebug) {
	LogIfDebug = function() {
		Log.apply(this, arguments);
	}
}

function Warn() {
	console.warn.apply(console, arguments);
	Toast(oString.strWarnTitle, Array.prototype.slice.call(arguments).map(function(x) {
		if(typeof o !== "object" || o === null) {
			return x;
		} else {
			return x.toString();
		}
	}).join(""));
}

function Error() {
	console.error.apply(console, arguments);
	Toast(oString.strErrorTitle, Array.prototype.slice.call(arguments).map(function(x) {
		if(typeof o !== "object" || o === null) {
			return x;
		} else {
			return x.toString();
		}
	}).join(""));
}

function AppVisible() {};

function CursorVisible() {};

function AppFocus() {
	return document.hasFocus() === true;
};

function KeyboardVisible() {
	return document.activeElement === deKeyboard;
};

function CursorHide() {};
function CursorShow() {};
var iCursor = 1;
function CursorHideCountIf0() {
	iCursor--;
	if (iCursor == 0) {
		CursorHide();
	}
};
function CursorShowCountIf0() {
	if (iCursor == 0) {
		CursorShow();
	}
	iCursor++;
};

var deScreenInput = null;
var iIntervalWakeOnLan = 0;
var iTimeoutSourceStatus = 0;
var pbInputSourceStatus = null;
function InputStatus() {
	return pbInputSourceStatus === true;
}
function InputConnected() {};
function InputDisconnected() {};
// Picks the InputConnected/InputDisconnected behavior for the active profile -
// previously a compile-time bInputDirect constant, now per-profile at runtime.
function ApplyInputDirectBehavior(bInputDirect) {
	if(bInputDirect) {
		InputConnected = function() {
			if(iIntervalWakeOnLan) {
				clearInterval(iIntervalWakeOnLan);
				iIntervalWakeOnLan = 0;
			}
			if(iTimeoutSourceStatus) {
				clearTimeout(iTimeoutSourceStatus);
				iTimeoutSourceStatus = 0;
			}
			if(ScreenExist(deScreenInput)) {
				ScreenCancel(deScreenInput);
			}
		};
		InputDisconnected = function() {
			deScreenInput = Dialog(oString.strAppTittle, oString.strInputDirectDisconnect, [
				{
					strName: oString.strInputDirectDisconnectStart,
					fAction: function() {
						iIntervalWakeOnLan = startInterval(function() {
							SendWol({
								arrMac: pActive.arrMac
							}, pActive.strBroadcast);
						}, 5000);
						iTimeoutSourceStatus = setTimeout(function() {
							iTimeoutSourceStatus = 0;
							deScreenInput = Dialog(oString.strAppTittle, oString.strInputDirectDisconnectWakeOnLanFailure, []);
						}, 5000);
					}
				}
			]);
		};
	} else {
		InputConnected = function() {
			if(ScreenExist(deScreenInput)) {
				ScreenCancel(deScreenInput);
			}
		};
		InputDisconnected = function() {
			deScreenInput = Dialog(oString.strAppTittle, oString.strInputIndirectDisconnect, []);
		};
	}
}
function SubscriptionInputStatus() {
	webOS.service.request("luna://com.webos.service.eim", {
		method: "getAllInputStatus",
		parameters: {
			subscribe: true
		},
		onSuccess: function(inResponse) {
			switch(inResponse.subscribed) {
				case true:
					LogIfDebug(oString.strGetAllInputStatusSuccess);
				case undefined:
					if(pActive === null) {
						ProbeActiveProfile(inResponse.devices);
						break;
					}
					var pbLastInputSourceStatus = pbInputSourceStatus;
					inResponse.devices.forEach(function(dDevice) {
						if(pActive.inputId === dDevice.id) {
							pbInputSourceStatus = dDevice.activate;
						}
					});
					if(pbLastInputSourceStatus === null || pbLastInputSourceStatus !== pbInputSourceStatus) {
						if(pbInputSourceStatus) {
							LogIfDebug(oString.strInputConnected);
							InputConnected();
							if(AppVisible()) {
								Open();
							}
						} else {
							LogIfDebug(oString.strInputDisconnected);
							if(pbLastInputSourceStatus !== null && AppVisible()) {
								Close();
							}
							InputDisconnected();
						}
					}
					break;
				default:
					Error(oString.strGetAllInputStatusFailure);
					break;
				}
		},
		onFailure: function(inError) {
			Error(oString.strGetAllInputStatusFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
			if(pActive !== null) {
				Open();
			}
		}
	});
}

// Checks whether the TV's currently active input matches one of the user's
// saved profiles - if so, this launch was triggered by switching to a bound
// input, so skip straight to the normal remote-control overlay. Otherwise
// this is a plain Home-launcher open, so show the configuration screen.
function ProbeActiveProfile(arrDevice) {
	var arrProfile = ProfilesLoad();
	var pMatch = null;
	(arrDevice || []).forEach(function(dDevice) {
		if(dDevice.activate) {
			arrProfile.forEach(function(pProfile) {
				if(pProfile.inputId === dDevice.id) {
					pMatch = pProfile;
				}
			});
		}
	});
	if(pMatch !== null) {
		ActivateProfile(pMatch);
	} else {
		ShowConfig(arrProfile);
	}
}

// One-shot re-check used right after the config screen adds/removes a
// profile, so saving one while already on the matching input can switch
// straight into remote-control mode without needing a relaunch.
function RefreshActiveProfile() {
	webOS.service.request("luna://com.webos.service.eim", {
		method: "getAllInputStatus",
		parameters: {},
		onSuccess: function(inResponse) {
			if(pActive === null) {
				ProbeActiveProfile(inResponse.devices);
			}
		},
		onFailure: function() {}
	});
}

function ActivateProfile(pProfile) {
	pActive = pProfile;
	pActive.arrMac = pProfile.mac.split(":").map(function(x) {
		return parseInt(x, 16);
	});
	pActive.strBroadcast = pProfile.sendIp.split(".").map(function(x, i) {
		return (x | (parseInt(pProfile.mask.split(".")[i], 10) ^ 0xFF)).toString(10);
	}).join(".");
	ApplyInputDirectBehavior(pProfile.inputDirect);
	ApplySocketBehavior(pProfile.inputDirect);
	HideConfig();
	SubscriptionGetSensorData();
	SubscriptionDomEvent();
	SubscriptionClose();
	LaunchInput();
}

// ---- Profile persistence ----

const strProfilesKey = "MagicRemoteServiceProfiles";

function ProfilesLoad() {
	try {
		var arrProfile = JSON.parse(localStorage.getItem(strProfilesKey));
		return Array.isArray(arrProfile) ? arrProfile : [];
	} catch(eError) {
		return [];
	}
}

function ProfilesSave(arrProfile) {
	localStorage.setItem(strProfilesKey, JSON.stringify(arrProfile));
}

// ---- EIM registration ----
//
// NOTE: unverified against real hardware. addDevice/deleteDevice only take a
// single shared appId (there's no separate per-input identifier in the
// payload), so it's not confirmed whether EIM can bind one appId to several
// physical inputs independently, or whether deleteDevice for one profile
// would also drop every other bound input under the same appId. To be safe,
// deleteDevice is only called when removing the last remaining profile -
// removing one of several just updates the local profile list.

function EimAddDevice(pProfile, fSuccess, fFailure) {
	webOS.service.request("luna://com.webos.service.eim", {
		method: "addDevice",
		parameters: {
			appId: strAppId,
			pigImage: "",
			mvpdIcon: "",
			type: "MVPD_IP",
			showPopup: true,
			label: oString.strAppTittle,
			description: pProfile.inputName
		},
		onSuccess: fSuccess,
		onFailure: fFailure
	});
}

function EimRemoveDevice(fSuccess, fFailure) {
	webOS.service.request("luna://com.webos.service.eim", {
		method: "deleteDevice",
		parameters: {
			appId: strAppId
		},
		onSuccess: fSuccess,
		onFailure: fFailure
	});
}

// ---- Configuration screen ----
//
// Shown when Load()/ProbeActiveProfile() find no saved profile matching the
// TV's current input - i.e. this was a plain Home-launcher open rather than
// a switch to a bound HDMI input.

var deConfig = document.getElementById("config");
var deConfigList = document.getElementById("configList");
var deConfigForm = document.getElementById("configForm");
var deConfigInput = document.getElementById("configInput");
var deConfigIp = document.getElementById("configIp");
var deConfigPort = document.getElementById("configPort");
var deConfigMask = document.getElementById("configMask");
var deConfigMac = document.getElementById("configMac");
var deConfigLongClick = document.getElementById("configLongClick");
var deConfigInputDirect = document.getElementById("configInputDirect");
var strConfigEditingInputId = null;

function ShowConfig(arrProfile) {
	document.getElementById("configTitle").innerText = oString.strAppTittle;
	document.getElementById("configAddButton").innerText = oString.strConfigAddProfile;
	document.getElementById("configInputLabel").innerText = oString.strConfigInputLabel;
	document.getElementById("configIpLabel").innerText = oString.strConfigPCIPLabel;
	document.getElementById("configPortLabel").innerText = oString.strConfigPCPortLabel;
	document.getElementById("configMaskLabel").innerText = oString.strConfigPCMaskLabel;
	document.getElementById("configMacLabel").innerText = oString.strConfigPCMacLabel;
	document.getElementById("configLongClickLabel").innerText = oString.strConfigLongClickLabel;
	document.getElementById("configInputDirectLabel").innerText = oString.strConfigInputDirectLabel;
	document.getElementById("configSaveButton").innerText = oString.strConfigSaveProfile;
	document.getElementById("configCancelButton").innerText = oString.strConfigCancel;
	RenderConfigList(arrProfile);
	deConfig.style.display = "";
}

function HideConfig() {
	deConfig.style.display = "none";
}

function RenderConfigList(arrProfile) {
	deConfigList.innerHTML = "";
	deConfigForm.style.display = "none";
	if(arrProfile.length === 0) {
		var deEmpty = document.createElement("div");
		deEmpty.innerText = oString.strConfigNoProfiles;
		deConfigList.appendChild(deEmpty);
	} else {
		arrProfile.forEach(function(pProfile) {
			var deItem = document.createElement("div");
			deItem.className = "config-list-item";
			var deLabel = document.createElement("span");
			deLabel.innerText = pProfile.inputName + " - " + pProfile.sendIp;
			deItem.appendChild(deLabel);
			var deButtonGroup = document.createElement("span");
			var deEditButton = document.createElement("button");
			deEditButton.type = "button";
			deEditButton.innerText = oString.strConfigEditProfile;
			deEditButton.addEventListener("click", function() {
				OpenConfigForm(pProfile);
			});
			var deDeleteButton = document.createElement("button");
			deDeleteButton.type = "button";
			deDeleteButton.innerText = oString.strConfigDeleteProfile;
			deDeleteButton.addEventListener("click", function() {
				DeleteProfile(pProfile);
			});
			deButtonGroup.appendChild(deEditButton);
			deButtonGroup.appendChild(deDeleteButton);
			deItem.appendChild(deButtonGroup);
			deConfigList.appendChild(deItem);
		});
	}
}

function PopulateConfigInputOptions(strSelectedInputId) {
	deConfigInput.innerHTML = "";
	var arrProfile = ProfilesLoad();
	arrInputList.forEach(function(pInput) {
		var bUsed = arrProfile.some(function(pProfile) {
			return pProfile.inputId === pInput.inputId && pInput.inputId !== strConfigEditingInputId;
		});
		if(!bUsed) {
			var deOption = document.createElement("option");
			deOption.value = pInput.inputId;
			deOption.innerText = pInput.inputName;
			if(pInput.inputId === strSelectedInputId) {
				deOption.selected = true;
			}
			deConfigInput.appendChild(deOption);
		}
	});
}

function OpenConfigForm(pProfile) {
	strConfigEditingInputId = pProfile ? pProfile.inputId : null;
	PopulateConfigInputOptions(pProfile ? pProfile.inputId : null);
	deConfigInput.disabled = !!pProfile;
	deConfigIp.value = pProfile ? pProfile.sendIp : "";
	deConfigPort.value = pProfile ? pProfile.sendPort : 41230;
	deConfigMask.value = pProfile ? pProfile.mask : "255.255.255.0";
	deConfigMac.value = pProfile ? pProfile.mac : "";
	deConfigLongClick.value = pProfile ? pProfile.longClick : 1500;
	deConfigInputDirect.checked = pProfile ? pProfile.inputDirect : true;
	deConfigForm.style.display = "";
}

function ValidIPv4(strValue) {
	return typeof strValue === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(strValue) && strValue.split(".").every(function(x) {
		return parseInt(x, 10) <= 255;
	});
}

function ValidMac(strValue) {
	return typeof strValue === "string" && /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(strValue);
}

function SaveConfigForm() {
	var pInput = arrInputList.filter(function(x) {
		return x.inputId === deConfigInput.value;
	})[0];
	if(!pInput || !ValidIPv4(deConfigIp.value) || !ValidIPv4(deConfigMask.value) || !ValidMac(deConfigMac.value)) {
		Error(oString.strConfigValidationError);
		return;
	}
	var pProfile = {
		inputId: pInput.inputId,
		inputAppId: pInput.inputAppId,
		inputName: pInput.inputName,
		sendIp: deConfigIp.value,
		sendPort: parseInt(deConfigPort.value, 10) || 41230,
		mask: deConfigMask.value,
		mac: deConfigMac.value.toUpperCase(),
		longClick: parseInt(deConfigLongClick.value, 10) || 1500,
		inputDirect: deConfigInputDirect.checked
	};
	EimAddDevice(pProfile, function() {
		LogIfDebug(oString.strAddDeviceSuccess);
		var arrProfile = ProfilesLoad().filter(function(x) {
			return x.inputId !== pProfile.inputId;
		});
		arrProfile.push(pProfile);
		ProfilesSave(arrProfile);
		RenderConfigList(arrProfile);
		RefreshActiveProfile();
	}, function(inError) {
		Error(oString.strAddDeviceFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
	});
}

function DeleteProfile(pProfile) {
	var arrRemaining = ProfilesLoad().filter(function(x) {
		return x.inputId !== pProfile.inputId;
	});
	function OnRemoved() {
		ProfilesSave(arrRemaining);
		RenderConfigList(arrRemaining);
	}
	if(arrRemaining.length === 0) {
		EimRemoveDevice(function() {
			LogIfDebug(oString.strRemoveDeviceSuccess);
			OnRemoved();
		}, function(inError) {
			Error(oString.strRemoveDeviceFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
		});
	} else {
		OnRemoved();
	}
}

document.getElementById("configAddButton").addEventListener("click", function() {
	OpenConfigForm(null);
});
document.getElementById("configCancelButton").addEventListener("click", function() {
	RenderConfigList(ProfilesLoad());
});
document.getElementById("configSaveButton").addEventListener("click", function() {
	SaveConfigForm();
});

var pCurrent = {
	dRhoAccelerationTotal: 0,
	dRhoAccelerationNextReset: 0,
	dRawX: 960,
	dRawY: 540,
	dX: 960,
	dY: 540,
	sRoundX: 960,
	sRoundY: 540,
	sLastRoundX: 960,
	sLastRoundY: 540
};

function ResetQuaternion() {
	webOS.service.request("luna://com.webos.service.mrcu", {
		method: "sensor/resetQuaternion",
		onSuccess: function(inResponse) {
			LogIfDebug(oString.strResetQuaternionSuccess);
		},
		onFailure: function (inError) {
			Error(oString.strResetQuaternionFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
		},
	});
}

// function IIR2Initialize(dFrequencyCut, dFrequencySample) {
// 	var dW = Math.tan((Math.PI * dFrequencyCut) / dFrequencySample);
// 	var dW2 = Math.pow(dW, 2);
// 	var d1 = 1 + (Math.SQRT2 * dW) + dW2;
// 	var d2 = 1 - (Math.SQRT2 * dW) + dW2;
// 	return {
// 		dIn0: 0,
// 		dIn1: 0,
// 		dIn2: 0,
// 		dOut0: 0,
// 		dOut1: 0,
// 		dOut2: 0,
// 		dCoefIn0: dW2 / d1,
// 		dCoefIn1: (2 * dW2) / d1,
// 		dCoefIn2: dW2 / d1,
// 		dCoefOut1: (-2 + (2 * dW2)) / d1,
// 		dCoefOut2: d2 / d1
// 	}
// }

// function IIR2Reset(dIn, iir2) {
// 	iir2.dIn0 = dIn;
// 	iir2.dIn1 = dIn;
// 	iir2.dIn2 = dIn;
// 	iir2.dOut0 = dIn;
// 	iir2.dOut1 = dIn;
// 	iir2.dOut2 = dIn;
// }

// function IIR2Calculate(dIn, iir2) {
// 	iir2.dIn2 = iir2.dIn1;
// 	iir2.dIn1 = iir2.dIn0;
// 	iir2.dIn0 = dIn;
// 	iir2.dOut2 = iir2.dOut1;
// 	iir2.dOut1 = iir2.dOut0;
// 	iir2.dOut0 = iir2.dCoefIn0 * iir2.dIn0 + iir2.dCoefIn1 * iir2.dIn1 + iir2.dCoefIn2 * iir2.dIn2 - iir2.dCoefOut1 * iir2.dOut1 - iir2.dCoefOut2 * iir2.dOut2;
// 	return iir2.dOut0;
// }

// function Smooth(dX, dFactor, dSpeed) {
// 	var dExp = Math.exp(dSpeed * dX);
// 	return dFactor * (((dX * (dExp + 1)) / (dExp - 1)) - (2 / dSpeed));
// }

function Smooth2(dX, dFactor, dSpeed, dSize) {
	var dDegree = Math.pow(dX, dSpeed);
	return  (dFactor * dX * dDegree) / (dDegree + dSize);
}

function SubscriptionGetSensorData() {
	webOS.service.request("luna://com.webos.service.mrcu", {
		method: "sensor/getSensorData",
		parameters: arrVersion[0] > 1 ? {
			callbackInterval: 1,
			subscribe: true
		} : {
			callbackInterval: 1,
			subscribe: true,
			sleep: true,
			autoAlign: false
		},
		onSuccess: function(inResponse) {
			switch(inResponse.subscribed) {
				case undefined:
					if(AppVisible() && AppFocus()) {
						if(iCursor == 0) {
							// var pitchX = -Math.atan2(2 * (inResponse.quaternion.q3 * inResponse.quaternion.q1 - inResponse.quaternion.q0 * inResponse.quaternion.q2), 1 - 2 * (qinResponse.quaternion.q1 * inResponse.quaternion.q1 - inResponse.quaternion.q0 * inResponse.quaternion.q0));
							// var pitchZ = -Math.atan2(2 * (inResponse.quaternion.q3 * inResponse.quaternion.q1 - inResponse.quaternion.q0 * inResponse.quaternion.q2), 1 - 2 * (inResponse.quaternion.q1 * inResponse.quaternion.q1 - inResponse.quaternion.q2 * inResponse.quaternion.q2));
							// var pitchY = -Math.asin(2 * (inResponse.quaternion.q3 * inResponse.quaternion.q1 - inResponse.quaternion.q0 * inResponse.quaternion.q2));
							
							var dRho = Math.sqrt(Math.pow(inResponse.gyroscope.z, 2) + Math.pow(inResponse.gyroscope.x, 2));
							if(dRho > 0.04) {
								var dTheta = Math.atan2(inResponse.gyroscope.z, inResponse.gyroscope.x) - Math.atan2(2 * (inResponse.quaternion.q3 * inResponse.quaternion.q1 - inResponse.quaternion.q0 * inResponse.quaternion.q2), 1 - 2 * (inResponse.quaternion.q1 * inResponse.quaternion.q1 - inResponse.quaternion.q0 * inResponse.quaternion.q0));
								var dRhoAcceleration = Smooth2(dRho, 75, 1, 0.5);
								pCurrent.dRhoAccelerationTotal += dRhoAcceleration;
								if(!TestRemoteEvent()) {
									pCurrent.dX += dRhoAcceleration * -Math.sin(dTheta);
									pCurrent.dY += dRhoAcceleration * -Math.cos(dTheta);
									TestLongClick();
									pCurrent.sRoundX = Math.round(pCurrent.dX);
									pCurrent.sRoundY = Math.round(pCurrent.dY);
									if(pCurrent.sLastRoundX != pCurrent.sRoundX || pCurrent.sLastRoundY != pCurrent.sRoundY) {
										SendPositionRelative({
											sX: pCurrent.sRoundX - pCurrent.sLastRoundX,
											sY: pCurrent.sRoundY - pCurrent.sLastRoundY
										});
										pCurrent.sLastRoundX = pCurrent.sRoundX;
										pCurrent.sLastRoundY = pCurrent.sRoundY;
									}
								}
							} else {
								if(pCurrent.dRhoAccelerationTotal > pCurrent.dRhoAccelerationNextReset) {
									ResetQuaternion();
									pCurrent.dRhoAccelerationNextReset += 1000;
								}
							}
						} else {
							pCurrent.dX = inResponse.coordinate.x;
							pCurrent.dY = inResponse.coordinate.y;
							TestLongClick();
							pCurrent.sRoundX = pCurrent.dX;
							pCurrent.sRoundY = pCurrent.dY;
							if(pCurrent.sLastRoundX != pCurrent.sRoundX || pCurrent.sLastRoundY != pCurrent.sRoundY) {
								SendPositionAbsolute({
									usX: pCurrent.sRoundX,
									usY: pCurrent.sRoundY
								});
								pCurrent.sLastRoundX = pCurrent.sRoundX;
								pCurrent.sLastRoundY = pCurrent.sRoundY;
							}
						}
					}
					break;
				case true:
					LogIfDebug(oString.strGetSensorDataSubscribe);
					break;
				default:
					Error(oString.strGetSensorDataFailure);
					break;
				}
		},
		onFailure: function(inError) {
			switch(inError.errorCode) {
				case "1301":
					LogIfDebug(oString.strGetSensorDataFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
					if(arrVersion[0] > 2) {
						document.oneEventListener("cursorStateChange", function(inEvent) {
							if(inEvent.detail.visibility) {
								SubscriptionGetSensorData();
								return true;
							} else {
								return false;
							}
						});
					} else {
						window.oneEventListener("keydown", function(inEvent) {
							switch(inEvent.keyCode) {
								case 0x600:
									SubscriptionGetSensorData();
									return true;
								default:
									return false;
							}
						});
					}
					break;
				default:
					Error(oString.strGetSensorDataFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
					break;
			}
		}
	});
}

function LaunchInput() {
	webOS.service.request("luna://com.webos.applicationManager", {
		method: "launch",
		parameters: {
			id: pActive.inputAppId
		},
		onSuccess: function(inResponse) {
			LogIfDebug(oString.strLaunchSuccess);
		},
		onFailure: function(inError) {
			Error(oString.strLaunchFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
		},
	});
}

function SubscriptionClose() {
	webOS.service.request("luna://" + strAppId + ".service", {
		method: "close",
		parameters: {
			subscribe: true
		},
		onSuccess: function(inResponse) {
			switch(inResponse.subscribed) {
				case undefined:
					window.close();
					break;
				case true:
					LogIfDebug(oString.strCloseSubscribe);
					break;
				default:
					Error(oString.strCloseFailure);
					break;
			}
		},
		onFailure: function(inError) {
			Error(oString.strCloseFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
		},
	});
}

function SubscriptionLog() {
	webOS.service.request("luna://" + strAppId + ".service", {
		method: "log",
		parameters: {
			subscribe: true
		},
		onSuccess: function(inResponse) {
			switch(inResponse.subscribed) {
				case undefined:
					switch(inResponse.log.iType){
						case 0:
							if(inResponse.log.bConsole){
								console.log(inResponse.log.strMessage);
							} else{
								Log(inResponse.log.strMessage);
							}
							break;
						case 1:
							if(inResponse.log.bConsole){
								console.warn(inResponse.log.strMessage);
							} else{
								Warn(inResponse.log.strMessage);
							}
							break;
						case 2:
							if(inResponse.log.bConsole){
								console.error(inResponse.log.strMessage);
							} else{
								Error(inResponse.log.strMessage);
							}
							break;
					}
					break;
				case true:
					LogIfDebug(oString.strLogSubscribe);
					break;
				default:
					Error(oString.strLogFailure);
					break;
			}
		},
		onFailure: function(inError) {
			Error(oString.strLogFailure + " [", inError.errorCode, ", ", inError.errorText, "]");
		},
	});
}

var iTimeoutLongClick = 0;
var pLongClick = {
	dX: 0,
	dY: 0
};
var bPositionDownSent = false;
function SetLongClick() {
	if(iTimeoutLongClick) {
		clearTimeout(iTimeoutLongClick);
	}
	iTimeoutLongClick = setTimeout(function() {
		iTimeoutLongClick = 0;
		SendKey({
			usC: 0x02,
			bS: true
		});
		SendKey({
			usC: 0x02,
			bS: false
		});
	}, pActive.longClick);
	pLongClick.dX = pCurrent.dX;
	pLongClick.dY = pCurrent.dY;
}

function TestLongClick() {
	if(!iTimeoutLongClick) {
		return false;
	} else if (Math.sqrt(Math.pow(pCurrent.dX - pLongClick.dX, 2) + Math.pow(pCurrent.dY - pLongClick.dY, 2)) > 3) {
		ResetLongClick();
		return false;
	} else {
		return true;
	}
}

function ResetLongClick() {
	clearTimeout(iTimeoutLongClick);
	iTimeoutLongClick = 0;
	SendKey({
		usC: 0x01,
		bS: true
	});
	bPositionDownSent = true;
}

var iTimeoutRemoteEvent = 0;
var dRhoAccelerationRemoteEvent = 0;
function SetRemoteEvent() {
	if(iTimeoutRemoteEvent) {
		clearTimeout(iTimeoutRemoteEvent);
	}
	iTimeoutRemoteEvent = setTimeout(function() {
		iTimeoutRemoteEvent = 0;
		dRhoAccelerationRemoteEvent = 0;
	}, uiRemoteEvent);
	dRhoAccelerationRemoteEvent = pCurrent.dRhoAccelerationTotal + 50;
}

function TestRemoteEvent() {
	if(!iTimeoutRemoteEvent) {
		return false;
	} else if(pCurrent.dRhoAccelerationTotal > dRhoAccelerationRemoteEvent) {
		ResetRemoteEvent();
		return false;
	} else {
		return true;
	}
}

function ResetRemoteEvent() {
	clearTimeout(iTimeoutRemoteEvent);
	iTimeoutRemoteEvent = 0;
	dRhoAccelerationRemoteEvent = 0;
}

function SubscriptionDomEvent() {
	deVideo.addEventListener("mousedown", function(inEvent) {
		SetLongClick();
		SetRemoteEvent();
	});

	deVideo.addEventListener("mouseup", function(inEvent) {
		if(iTimeoutLongClick) {
			ResetLongClick();
		}
		if(bPositionDownSent) {
			SendKey({
				usC: 0x01,
				bS: false
			});
			bPositionDownSent = false;
		}
		SetRemoteEvent();
	});

	if(arrVersion[0] > 1) {
		deVideo.addEventListener("wheel", function(inEvent) {
			SendWheel({
				sY: inEvent.deltaY
			});
			SetRemoteEvent();
		});
	} else {
		deVideo.addEventListener("mousewheel", function(inEvent) {
			SendWheel({
				sY: inEvent.wheelDeltaY
			});
			SetRemoteEvent();
		});
	}

	document.addEventListener("keydown", function(inEvent) {
		SendKey({
			usC: inEvent.keyCode,
			bS: true
		});
		SetRemoteEvent();
	});

	document.addEventListener("keyup", function(inEvent) {
		SendKey({
			usC: inEvent.keyCode,
			bS: false
		});
		SetRemoteEvent();
	});

	deKeyboard.addEventListener("input", function(inEvent) {
		for(var i = 0; i < deKeyboard.value.length; i++){
			SendUnicode({
				usC: deKeyboard.value.charCodeAt(i)
			});
		}
		deKeyboard.value = "";
	});

	document.addEventListener(arrVersion[0] > 2 ? "visibilitychange" : "webkitvisibilitychange", function(inEvent) {
		if(InputStatus()) {
			if(AppVisible()) {
				Open();
			} else {
				Close();
			}
		}
	});

	window.addEventListener("focus", function(inEvent) {
		if(CursorVisible()) {
			SendVisible({
				bV: true
			});
		}
	});

	window.addEventListener("blur", function(inEvent) {
		if(CursorVisible()) {
			SendVisible({
				bV: false
			});
		}
	});

	if(arrVersion[0] > 2) {
		document.addEventListener("cursorStateChange", function(inEvent) {
			SendVisible({
				bV: CursorVisible()
			});
		});
	} else {
		document.addEventListener("keydown", function(inEvent) {
			switch(inEvent.keyCode) {
				case 0x600:
					CursorVisible = function() {
						return true;
					};
					SendVisible({
						bV: CursorVisible()
					});
					break;
				case 0x601:
					CursorVisible = function() {
						return false;
					};
					SendVisible({
						bV: CursorVisible()
					});
					break;
			}
		});
	}

	deKeyboard.addEventListener("focus", function(inEvent) {
		CursorShowCountIf0();
	});
	deKeyboard.addEventListener("blur", function(inEvent) {
		CursorHideCountIf0();
	});
}

var deScreenOpen = null;
var deScreenShutdown = null;
var iIntervalRetryOpen = 0;
var iTimeoutOpen = 0;
var socClient = null;
function SocketOpened() {};
function SocketClosed() {};
// Picks the SocketOpened/SocketClosed behavior for the active profile -
// previously a compile-time bInputDirect constant, now per-profile at runtime.
function ApplySocketBehavior(bInputDirect) {
	if(bInputDirect) {
		SocketOpened = function() {
			if(iTimeoutOpen) {
				clearTimeout(iTimeoutOpen);
				iTimeoutOpen = 0;
			}
			if(ScreenExist(deScreenOpen)) {
				ScreenCancel(deScreenOpen);
			}
		}
		SocketClosed = function() {
			iTimeoutOpen = setTimeout(function() {
				iTimeoutOpen = 0;
				deScreenOpen = Dialog(oString.strAppTittle, oString.strSocketOpenTimeout, []);
			}, 30000);
		};
	} else {
		SocketOpened = function() {
			if(iTimeoutOpen) {
				clearTimeout(iTimeoutOpen);
				iTimeoutOpen = 0;
			}
			if(iIntervalWakeOnLan) {
				clearInterval(iIntervalWakeOnLan);
				iIntervalWakeOnLan = 0;
			}
			if(ScreenExist(deScreenOpen)) {
				ScreenCancel(deScreenOpen);
			}
		}
		SocketClosed = function() {
			deScreenOpen = Dialog(oString.strAppTittle, oString.strSocketOpen, [
				{
					strName: oString.strSocketOpenStart,
					fAction: function() {
						iIntervalWakeOnLan = startInterval(function() {
							SendWol({
								arrMac: pActive.arrMac
							}, pActive.strBroadcast);
						}, 5000);
						iTimeoutOpen = setTimeout(function() {
							iTimeoutOpen = 0;
							deScreenOpen = Dialog(oString.strAppTittle, oString.strSocketOpenTimeoutWakeOnLanFailure, []);
						}, 30000);
					}
				}
			]);
		};
	}
}
function SocketOpen() {
	socClient = new WebSocket("ws://" + pActive.sendIp + ":" + pActive.sendPort);
	socClient.binaryType = "arraybuffer";
	socClient.onopen = function(e) {
		LogIfDebug(oString.strSocketOpened);
		SocketOpened();
		clearInterval(iIntervalRetryOpen);
		iIntervalRetryOpen = 0;
		if(ScreenExist(deScreenOpen)) {
			ScreenCancel(deScreenOpen);
		}
		CursorHideCountIf0();
		if(CursorVisible() && AppVisible() && AppFocus()) {
			SendVisible({
				bV: true
			});
		}
	};
	socClient.onclose = function(e) {
		LogIfDebug(oString.strSocketClosed);
		if(socClient !== null && !iIntervalRetryOpen) {
			CursorShowCountIf0();
			SocketClosed();
			iIntervalRetryOpen = setInterval(function() {
				if(socClient.readyState === WebSocket.CONNECTING) {
					socClient.close();
				}
				SocketOpen();
			}, 5000);
			SocketOpen();
		}
	};
	socClient.onmessage = function(e) {
		if(e.data instanceof ArrayBuffer) {
			var dwData = new DataView(e.data);
			switch(dwData.getUint8(0)) {
				case 0x01:
					if(ScreenExist(deScreenShutdown)) {
						ScreenCancel(deScreenShutdown);
					} else {
						deScreenShutdown = Dialog(oString.strAppTittle, oString.strShutdownMessage, [
							{
								strName: oString.strShutdownShutdown,
								fAction: function() {
									SendShutdown();
								}
							}, {
								strName: oString.strShutdownAbort,
								fAction: null
							}
						]);
					}
					break;
				case 0x02:
					if(KeyboardVisible()) {
						deKeyboard.blur();
					} else {
						deKeyboard.focus();
					}
					break;
				default:
					Error(oString.strActionUnprocessed);
			}
		} else {
			Log(e.data);
		}
	}
}
function SocketClose() {
	var soc = socClient;
	socClient = null;
	soc.close();
}
function Open() {
	if(socClient !== null) {
		Error(oString.strSocketErrorOpen);
	} else {
		SocketClosed();
		iIntervalRetryOpen = setInterval(function() {
			if(socClient.readyState === WebSocket.CONNECTING) {
				socClient.close();
			}
			SocketOpen();
		}, 5000);
		SocketOpen();
	}
}
function Close() {
	if(socClient === null) {
		Error(oString.strSocketErrorClose);
	} else {
		SocketOpened();
		if(iIntervalRetryOpen) {
			clearInterval(iIntervalRetryOpen);
			iIntervalRetryOpen = 0;
		}
		if(AppVisible() && AppFocus() && CursorVisible()) {
			SendVisible({
				bV: false
			});
		}
		if(ScreenExist(deScreenShutdown)) {
			ScreenCancel(deScreenShutdown);
		}
		if(KeyboardVisible()) {
			deKeyboard.blur();
		}
		SocketClose();
	}
}

function SendWol(mMac, strBroadcast) {
	webOS.service.request("luna://" + strAppId + ".service", {
		method: "wol",
		parameters: {
			mMac: mMac,
			strBroadcast: strBroadcast
		},
		onSuccess: function(inResponse) {
			LogIfDebug(oString.strSendWolSuccess + " [0x" + inResponse.strBuffer + "]@" + strBroadcast + ":9 ", mMac);
		},
		onFailure: function(inError) {
			Error(oString.strSendWolFailure + " [", inError.errorCode, ", ", inError.errorText, "]@" + strBroadcast + ":9 ", mMac);
		}
	});
}

var bufPositionRelative = new ArrayBuffer(5);
var dwPositionRelative = new DataView(bufPositionRelative);
dwPositionRelative.setUint8(0, MessageType.PositionRelative);
function SendPositionRelative(pPositionRelative) {
	if(socClient !== null && socClient.readyState === WebSocket.OPEN) {
		try {
			dwPositionRelative.setInt16(1, pPositionRelative.sX, true);
			dwPositionRelative.setInt16(3, pPositionRelative.sY, true);
			socClient.send(bufPositionRelative);
			//LogIfDebug(oString.strSendPositionRelativeSuccess + " [0x" + bufPositionRelative.toString(16) + "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", pPositionRelative);
		} catch(eError) {
			Error(oString.strSendPositionRelativeFailure + " [", eError, "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", pPositionRelative);
		}
	}
}

var bufPositionAbsolute = new ArrayBuffer(5);
var dwPositionAbsolute = new DataView(bufPositionAbsolute);
dwPositionAbsolute.setUint8(0, MessageType.PositionAbsolute);
function SendPositionAbsolute(pPositionAbsolute) {
	if(socClient !== null && socClient.readyState === WebSocket.OPEN) {
		try {
			dwPositionAbsolute.setUint16(1, pPositionAbsolute.usX, true);
			dwPositionAbsolute.setUint16(3, pPositionAbsolute.usY, true);
			socClient.send(bufPositionAbsolute);
			//LogIfDebug(oString.strSendPositionAbsoluteSuccess + " [0x" + bufPositionAbsolute.toString(16) + "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", pPositionAbsolute);
		} catch(eError) {
			Error(oString.strSendPositionAbsoluteFailure + " [", eError, "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", pPositionAbsolute);
		}
	}
}

var bufWheel = new ArrayBuffer(3);
var dwWheel = new DataView(bufWheel);
dwWheel.setUint8(0, MessageType.Wheel);
function SendWheel(wWheel) {
	if(socClient !== null && socClient.readyState === WebSocket.OPEN) {
		try {
			dwWheel.setInt16(1, wWheel.sY, true);
			socClient.send(bufWheel);
			LogIfDebug(oString.strSendWheelSuccess + " [0x" + bufWheel.toString(16) + "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", wWheel);
		} catch(eError) {
			Error(oString.strSendWheelFailure + " [", eError, "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", wWheel);
		}
	}
}

var bufVisible = new ArrayBuffer(2);
var dwVisible = new DataView(bufVisible);
dwVisible.setUint8(0, MessageType.Visible);
function SendVisible(vVisible) {
	if(socClient !== null && socClient.readyState === WebSocket.OPEN) {
		try {
			dwVisible.setUint8(1, vVisible.bV);
			socClient.send(bufVisible);
			LogIfDebug(oString.strSendVisibleSuccess + " [0x" + bufVisible.toString(16) + "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", vVisible);
		} catch(eError) {
			Error(oString.strSendVisibleFailure + " [", eError, "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", vVisible);
		}
	}
}

var bufKey = new ArrayBuffer(4);
var dwKey = new DataView(bufKey);
dwKey.setUint8(0, MessageType.Key);
function SendKey(kKey) {
	if(socClient !== null && socClient.readyState === WebSocket.OPEN) {
		try {
			dwKey.setUint16(1, kKey.usC, true);
			dwKey.setUint8(3, kKey.bS);
			socClient.send(bufKey);
			LogIfDebug(oString.strSendKeySuccess + " [0x" + bufKey.toString(16) + "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", kKey);
		} catch(eError) {
			Error(oString.strSendKeyFailure + " [", eError, "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", kKey);
		}
	}
}

var bufUnicode = new ArrayBuffer(3);
var dwUnicode = new DataView(bufUnicode);
dwUnicode.setUint8(0, MessageType.Unicode);
function SendUnicode(kUnicode) {
	if(socClient !== null && socClient.readyState === WebSocket.OPEN) {
		try {
			dwUnicode.setUint16(1, kUnicode.usC, true);
			socClient.send(bufUnicode);
			LogIfDebug(oString.strSendUnicodeSuccess + " [0x" + bufUnicode.toString(16) + "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", kUnicode);
		} catch(eError) {
			Error(oString.strSendUnicodeFailure + " [", eError, "]@" + pActive.sendIp + ":" + pActive.sendPort + " ", kUnicode);
		}
	}
}

var bufShutdown = new ArrayBuffer(1);
var dwShutdown = new DataView(bufShutdown);
dwShutdown.setUint8(0, MessageType.Shutdown);
function SendShutdown() {
	if(socClient !== null && socClient.readyState === WebSocket.OPEN) {
		try {
			socClient.send(bufShutdown);
			LogIfDebug(oString.strSendShutdownSuccess + " [0x" + bufShutdown.toString(16) + "]@" + pActive.sendIp + ":" + pActive.sendPort);
		} catch(eError) {
			Error(oString.strSendShutdownFailure + " [", eError, "]@" + pActive.sendIp + ":" + pActive.sendPort);
		}
	}
}

webOS.service.request("luna://com.webos.service.tv.systemproperty", {
	method: "getSystemInfo",
	parameters: {
		keys: ["sdkVersion"]
	},
	onSuccess: function(inResponse) {
		arrVersion = inResponse.sdkVersion.split(".").map(function(x) {
			return parseInt(x);
		});
		Load();
	},
	onFailure: function(inError) {
		throw new Error(inError.errorText);
	}
});

webOS.service.request("luna://com.webos.settingsservice", {
	method: "getSystemSettings",
	parameters: {
		keys: ["localeInfo"],
		subscribe: true
	},
	onSuccess: function(inResponse) {
		readJson(function(oInfo) {
			oString = oInfo;
			function readJsonLocale(i, arr){
				if(i < arr.length){
					readJson(function(oInfo) {
						if(oInfo !== undefined){
							oString.spread(oInfo);
						}
						readJsonLocale(i + 1, arr);
					}, strPath + "resources/" + arr.slice(0, i + 1).join("/") + "/appstring.json");
				} else {
					Load();
				}
			}
			readJsonLocale(0, inResponse.settings.localeInfo.locales.UI.split("-"));
		}, strPath + "/appstring.json");
	},
	onFailure: function(inError) {
		throw new Error(inError.errorText);
	}
});

var bLoaded = false;
function Load() {
	if(arrVersion !== null && oString !== null && bLoaded === false) {
		bLoaded = true;
		if(arrVersion[0] > 2) {
			AppVisible = function() {
				return document.hidden === false;
			};
		} else {
			AppVisible = function() {
				return document.webkitHidden === false;
			};
		}
		if(arrVersion[0] > 4) {
			CursorHide = function() {
				webOSSystem.setCursor(strPath + "/cursor.png", 0, 0);
			};
			CursorShow = function() {
				webOSSystem.setCursor("default");
			};	
		} else if(arrVersion[0] > 2) {
			CursorHide = function() {
				PalmSystem.setCursor(strPath + "/cursor.png", 0, 0);
			};
			CursorShow = function() {
				PalmSystem.setCursor("default");
			};	
		} else {
			//CursorHide = function() {};
			//CursorShow = function() {};	
		}
		if(arrVersion[0] > 4) {
			CursorVisible = function() {
				return webOSSystem.cursor.visibility === true;
			};
		} else if(arrVersion[0] > 2) {
			CursorVisible = function() {
				return PalmSystem.cursor.visibility === true;
			};
		} else {
			CursorVisible = function() {
				return false;
			};
		}

		SubscriptionLog();
		// This decides config-screen vs remote-control mode by checking whether
		// the TV's active input matches a saved profile - see ProbeActiveProfile.
		// SubscriptionGetSensorData/SubscriptionDomEvent/SubscriptionClose/LaunchInput
		// only start once ActivateProfile() picks a profile.
		SubscriptionInputStatus();
	}
}
