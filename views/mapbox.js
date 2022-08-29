// const locations = document.getElementById('map').dataset.locations;
// console.log(locations);
const map = L.map('map').setView([51.505, -0.09], 13);
const titleUrl = 'https://{s}.title.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = 'asgfsdgd';
const title = L.tileLayer(titleUrl,{attribution});
title.addTo();