import axios from "axios";

const api = axios.create({

    baseURL: "https://provinces.open-api.vn/api"

});

export interface District{

    code:number;

    name:string;

}

export interface Ward{

    code:number;

    name:string;

}

export const getHaNoiDistricts=async()=>{

    const res=await api.get("/p/1?depth=2");

    return res.data.districts;

};

export const getWards=async(

    districtCode:number

)=>{

    const res=

    await api.get(

        `/d/${districtCode}?depth=2`

    );

    return res.data.wards;

};
