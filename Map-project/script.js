'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Workout class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    // propertise
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  // Here I am setting the date and type for the marker popUp
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// child class of Workout
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// child class of Workout
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevatingGains) {
    super(coords, distance, duration);
    this.elevatingGains = elevatingGains;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration * 60);
  }
}

// Global Variable
let map, mapEvent;

// Main class
class App {
  // Private variable for the class instance
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    // we can also call the methods here for rendering purpose too.
    this._getPosition();
    // Get Local Storage
    this._getLocalStorage();
    // ///////////// I just Create a seprate method for this _newWorkout.
    form.addEventListener('submit', this._newWorkout.bind(this));
    // Changing from cycle to running
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // Creating a new method for position
  _getPosition() {
    if (navigator.geolocation)
      //    IF (this) did not show you the current object and through undefined then use bind(this) method onto top of your code where it used.
      // Because in regular function the (this) keyword work as undefined.
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }
  // Loading the map after taking the current position.
  // Also this is the part of Succes method/function in te getPosition method so i created it seperately for batter understanding.
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    // OverView of third Party Leaflet.js
    console.log(this);
    this.#map = L.map('map').setView(coords, 13);
    // Jb light ay g to ismy s theme change krn ki doc daikhn h openstreem map k
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // Handling clicks and removing the class of FORM which is remove.

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    // console.log(mapEvent);
  }

  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
  }
  _toggleElevationField() {
    // Togling if the class is hiden then set to null if not then set to hidden
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    // Creating a function in them i am checking wether the value is number/finite or not
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();
    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if worlout running, create running object

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check data is valid or not.
      // Checking if the distance value is number or also positive as well
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
        !validInputs(distance, duration, elevation)
      )
        return alert('Inputs have to positive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // console.log(workout);

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);
    // Rendering workout marker.
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkoutSide(workout);
    // Clearing the input field after submiting the form.
    this._hideForm();
    // Set Local storage.
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // render workout on a map as array
    // Displaying the marker
    // // I just destructured latitude and longitude from the On event to MapEvent...
    // console.log(mapEvent);
    // const { lat, lng } = this.#mapEvent.latlng;
    // Setting the marker to the map

    L.marker(workout.coords)
      .addTo(this.#map)
      // Customizing the popup and marker
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`
      )
      .openPopup();
  }

  _renderWorkoutSide(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      // Here I am just adding extra html if the workout is runnin.
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        
        `;
    }

    if (workout.type === 'cycling') {
      // Same here adding the html
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevatingGains}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workEl = e.target.closest('.workout');
    console.log(workEl);

    if (!workEl) return;
    // Finding workouts id and then checking them with the closest html tag id
    const workout = this.#workouts.find(work => work.id === workEl.dataset.id);
    console.log(workout);
    // Creating a smooth movement
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    console.log(data);

    // Just Initialize the #workout to data
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkoutSide(work);
    });
  }
}
// to run the app
const app = new App();
// app._getPosition();
