import React, { useState, useEffect } from "react";
import './rangeofficer.css';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import * as data from './texts/texts.json';
import moment from 'moment'
import axios from 'axios';

const colors = {
  green: '#658f60',
  red: '#c97b7b',
  white: '#f2f0eb',
  orange: '#f2c66d',
  lightgreen: '#b2d9ad',
  blue: '#95d5db'
}
const rowStyle = {
  flexDirection: "row",
  display: "flex",
  justifyContent: "center"
}
const trackRowStyle = {
  flexDirection: "row",
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap"
}
const greenButtonStyle = {
  fontSize: 17,
  backgroundColor: colors.green,
  borderRadius: 50,
  width:250,
  height:100
}
const orangeButtonStyle = {
  fontSize: 17,
  backgroundColor: colors.orange,
  borderRadius: 50,
  width:250,
  height:100
}
const redButtonStyle = {
  fontSize: 17,
  backgroundColor: colors.red,
  borderRadius: 50,
  width:250,
  height:100
}
const rangeStyle = {
  textAlign: "center",
  padding: 20,
  marginLeft: 15
}

//shooting track rows
const TrackRows = ({tracks, setTracks, scheduleId, tablet, fin}) => {
  return (
    tracks.map(track =>
               <div key={track.id}>
                 <div style={rangeStyle}>
                   <Typography
                     align="center">
                     {track.name}
                   </Typography>

                   <TrackButtons track={track} tracks={tracks} setTracks={setTracks}
                                 scheduleId={scheduleId}
	                         tablet={tablet} fin={fin}/>
                 </div>
               </div>
              )
  )
}

const TrackButtons = ({track, tracks, setTracks, scheduleId, tablet, fin}) => {
  const buttonStyle = {
    backgroundColor:`${track.color}`,
    borderRadius: 30,
    width: 100
  }
  
  const [buttonColor, setButtonColor] = useState(track.color);

  let text = tablet.Green[fin];
  if (track.trackSupervision==="absent") { text = tablet.White[fin]; }
  else if (track.trackSupervision==="closed") { text = tablet.Red[fin]; }

  const HandleClick = () => {
    let newSupervision = "absent";
    track.color=colors.white;
    
    if(track.trackSupervision==="absent") {
      newSupervision="closed";
      track.color=colors.red;
    }
    else if(track.trackSupervision==="closed") {
      newSupervision="present";
      track.color=colors.green;
    }
    
    let token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    let query = "/api/track-supervision/" + scheduleId + "/" + track.id;
    axios.put(query,
              {
                track_supervisor: newSupervision
              }, config)
      .catch(error => {
        //console.log(error)
      })
      .then(res => {
	if(res) {
          track.trackSupervision = newSupervision;
          setButtonColor(track.color);
	}
      })
  }

  return (
    <Button
      style={buttonStyle}
      size='large'
      variant={'contained'}
      onClick={HandleClick}>
      {text}
    </Button>
  )
}

async function getColors(tracks, setTracks) {
  const copy = [...tracks]
  
  for(let i=0; i<copy.length; i++) {
    let obj = copy[i];
    if(copy[i].trackSupervision==="present") {obj.color=colors.green}
    else if(copy[i].trackSupervision==="closed") {obj.color=colors.red}
    else if(copy[i].trackSupervision==="absent") {obj.color=colors.white}
    else if(copy[i].trackSupervision==="en route") {obj.color=colors.orange}
  }

  setTracks(copy)
}

async function getData(tablet, fin, setHours, tracks, setTracks, setStatusText, setStatusColor, setScheduleId) {

  let date = moment(Date.now()).format("YYYY-MM-DD");

  await fetch(`/api/datesupreme/${date}`)
    .then(res => res.json())
    .then(response => {
      setScheduleId(response.scheduleId);
      setHours([moment(response.open, 'h:mm').format('H.mm'),
                moment(response.close, 'h:mm').format('H.mm')]);

      if (response.rangeSupervision === 'present') {
        setStatusText(tablet.SuperGreen[fin]);
        setStatusColor(colors.green);
      } 
      else if (response.rangeSupervision === 'en route') {
        setStatusText(tablet.SuperOrange[fin]);
        setStatusColor(colors.orange);
      } 
      else if (response.rangeSupervision === 'absent') {
        setStatusText(tablet.Red[fin]);
        setStatusColor(colors.red);
      }
      else if (response.rangeSupervision === 'confirmed') {
        setStatusText(tablet.SuperLightGreen[fin]);
        setStatusColor(colors.lightgreen);
      }
      else if (response.rangeSupervision === 'not confirmed') {
        setStatusText(tablet.SuperBlue[fin]);
        setStatusColor(colors.blue);
      }
      else {
        setStatusText(tablet.SuperWhite[fin]);
	setStatusColor(colors.white);
      }
      getColors(response.tracks, setTracks)
    })
  
}

const Tabletview = () => {
  const [statusColor, setStatusColor] = useState();
  const [statusText, setStatusText] = useState();
  const [hours, setHours] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [scheduleId, setScheduleId] = useState();
  const fin = localStorage.getItem("language");
  const {tablet} = data;
  let today = moment().format("DD.MM.YYYY");

  const statusStyle = {
    color: "black",
    backgroundColor: statusColor,
    borderRadius: 3,
    width: 300
  }
  
  useEffect(() => {
    getData(tablet, fin, setHours, tracks, setTracks, setStatusText, setStatusColor, setScheduleId);
  }, []);

  const HandlePresentClick = () => {
    updateSupervisor("present", colors.green, tablet.SuperGreen[fin]);
  }

  const HandleEnRouteClick = () => {
    updateSupervisor("en route", colors.orange, tablet.SuperOrange[fin]);
  }

  const HandleClosedClick = () => {
    updateSupervisor("absent", colors.red, tablet.Red[fin]);
  }

  async function updateSupervisor(status, color, text) {
    let token = localStorage.getItem("token");
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    let query = "api/range-supervision/" + scheduleId;
    await axios.put(query,
                    {
                      range_supervisor:status
                    }, config)
      .then(res => {
        if(res) {
          setStatusColor(color);
          setStatusText(text);
        }
      })
      .catch(error => {
        //console.log(error)
      })
  }

  return (
    <div>
      <Typography
        variant="body1"
        align="center">
        <br />
        {today}
      </Typography>
      <Typography
        variant="body1"
        align="center">
        {tablet.Open[fin]}: {hours[0]} - {hours[1]}
      </Typography>
      &nbsp;
      
      <div style={rowStyle}>
        <Button
          style={statusStyle}
          size='large'
          variant='outlined'
          disabled>
          {statusText}
        </Button>
      </div>

      <Typography
        variant="body1"
        align="center">
        <br />
        {tablet.HelperFirst[fin]}
      </Typography>

      <div style={rowStyle}>
        <Button
          style={greenButtonStyle}
          size='large'
          variant='contained'
          onClick={HandlePresentClick}>
          {tablet.Green[fin]}
        </Button>
        &nbsp;
        <Button
          style={orangeButtonStyle}
          size='large'
          variant='contained'
          onClick={HandleEnRouteClick}>
          {tablet.Orange[fin]}
        </Button>
        &nbsp;
        <Button
          style={redButtonStyle}
          size='large'
          variant='contained'
          onClick={HandleClosedClick}>
          {tablet.Red[fin]}
        </Button>
      </div>
      
      &nbsp;
      <Typography
        variant="body1"
        align="center">
        {tablet.HelperSecond[fin]}
      </Typography>

      <div style={trackRowStyle}>
        <TrackRows tracks={tracks} setTracks={setTracks}
                   scheduleId={scheduleId} tablet={tablet} fin={fin} />
      </div>
    </div>
    
  )
}

export default Tabletview;
