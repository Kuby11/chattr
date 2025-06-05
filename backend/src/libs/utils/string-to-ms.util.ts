export function stringToMs(str){
	let summ = 0, time, type, value;
	let time_list = ('' + str).split(' ').filter(v => v != '' && /^(\d{1,}\.)?\d{1,}([wdhms])?$/i.test(v));

	for(let i = 0, len = time_list.length; i < len; i++){
		time = time_list[i];
		type = time.match(/[wdhms]$/i);

		if(type){
			value = Number(time.replace(type[0], ''));

		switch(type[0].toLowerCase()){
			case 'w':
				summ += value * 604800000;
			break;
			case 'd':
				summ += value * 86400000;
			break;
			case 'h':
				summ += value * 3600000;
			break;
			case 'm':
				summ += value * 60000;
			break;
			case 's':
				summ += value * 1000;
			break;
		}
		}else if(!isNaN(parseFloat(time)) && isFinite(time)){
			summ += parseFloat(time);
		}
	}
	return summ;
}
