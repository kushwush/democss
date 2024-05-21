sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
],
/**
 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, JSONModel) {
		"use strict";
		
		return Controller.extend("project1.controller.View1", {
			onInit: function () { 
				const oModel = new JSONModel();
				this.getView().setModel(oModel, 'siloModel');
			},

			_fetchSiloData: async function () {
				const oBusyDialog = new sap.m.BusyDialog();
				try {
					oBusyDialog.setTitle("Fetching Silo Data");
					oBusyDialog.setText("Please wait...");
					oBusyDialog.open();
					const response = await new Promise((resolve, reject) => {
						this.getOwnerComponent().getModel().read("/SiloSet", {
							success: (oData) => {
								let result = oData.results.map((oSilo) => {
									return {
										siloid: oSilo.Siloid,
										height: parseFloat(oSilo.Zeroheight),
										targetHeight: parseFloat(oSilo.Currentheight).toFixed(3),
										material: oSilo.Materialid,
										materialName: oSilo.Materialname,
										quantity: oSilo.Quantity,
										uom: oSilo.Uom
									};
								})
								resolve(result)
							},
							error: (oError) => reject(oError)
						});
					});
					console.log(response);
					oBusyDialog.close();
					this.siloData = response;
				} catch (error) {
					oBusyDialog.setText("Error fetching data, check the console for more information");
					console.error(error);
				}
			},

			formatHeight: function (sHeight) {
				return `${sHeight}%`;
			},
			onAfterRendering: function () {
				this.postRenderOperations();
			},

			postRenderOperations: async function () {
				await this._fetchSiloData();
				if (Array.isArray(this.siloData)) {
					await this.prepareModel(this.siloData);
					await this.setAutoUpdateTrigger();
					const SilosHBox = this.byId('idSilosHBox');
					const Silos = this.getView().getModel("siloModel").getProperty('/silos');
					if (SilosHBox.getItems().length)
						Silos.forEach((oSilo, index) => {
							SilosHBox.getItems()[index].addStyleClass(oSilo.material);
						});
				}
			},
			prepareModel: async function (siloData) {
				const oModel = this.getView().getModel("siloModel");
				oModel.setProperty('/silos', siloData);
				// Update heights after the view is rendered to trigger the animation
				setTimeout(() => {
					var aSilos = oModel.getProperty('/silos');
					console.log(aSilos);
					aSilos.forEach((silo, index) => {
						oModel.setProperty(`/silos/${index}/height`, silo.targetHeight);
					});
				}, 1500); // Delay can be adjusted
			},

			setAutoUpdateTrigger: async function () {
				this.intervalTrigger = new sap.ui.core.IntervalTrigger(2500);
				setTimeout(() => {
					this.intervalTrigger.addListener(() => {
						this._autoUpdate();
					});

				}, 5000)
			},
			_autoUpdate: function () {
				const oModel = this.getView().getModel("siloModel");
				const aSilos = oModel.getProperty('/silos');
				aSilos.forEach((_oSilo, index) => {
					let iRandom;
					if (index % 2 === 0) {
						// between 50 and 100
						iRandom = Math.floor(Math.random() * 50) + 50;
					} else {
						// between 0 and 50
						iRandom = Math.floor(Math.random() * 50);
					}
					oModel.setProperty(`/silos/${index}/height`, iRandom);
				});
			}				
		});
	});
