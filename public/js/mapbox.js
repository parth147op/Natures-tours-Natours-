// const locations = document.getElementById('map').dataset.locations;
// console.log(locations);

const map = L.map('map').setView([23.5,72.01], 6);
const titleUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution ='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Coded by coder\'s gyan with ❤️';
const title = L.tileLayer(titleUrl,{attribution});
title.addTo(map);
const CLayer = L.circle([23.5,72.01],{});
CLayer.addTo(map);
        