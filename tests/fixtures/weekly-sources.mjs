/* Only used by the isolated browser test server. Never loaded in deployments. */
const original=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 const url=String(input?.url||input);
 const now=new Date(),day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 if(url.startsWith('https://geocoding-api.open-meteo.com/'))return Response.json({results:[{name:'Plainfield',country_code:'US',admin1:'Illinois',latitude:41.6,longitude:-88.2}]});
 if(url.startsWith('https://api.weather.gov/points/'))return Response.json({properties:{forecast:'https://api.weather.gov/gridpoints/LOT/1,1/forecast',timeZone:'America/Chicago'}});
 if(url.startsWith('https://api.weather.gov/alerts/'))return Response.json({features:[]});
 if(url.startsWith('https://api.weather.gov/gridpoints/'))return Response.json({properties:{updated:now.toISOString(),periods:[{name:'Today',startTime:day+'T06:00:00-05:00',isDaytime:true,temperature:86,temperatureUnit:'F',probabilityOfPrecipitation:{value:10},shortForecast:'Sunny'},{name:'Tonight',startTime:day+'T18:00:00-05:00',isDaytime:false,temperature:37,temperatureUnit:'F',probabilityOfPrecipitation:{value:0},shortForecast:'Clear'}]}});
 if(url.startsWith('https://extension.illinois.edu/'))return new Response('<html><title>Isolated Extension fixture</title></html>',{headers:{'content-type':'text/html'}});
 return original(input,options);
};
