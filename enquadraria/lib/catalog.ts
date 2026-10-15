export const categories=['Filmes','Séries','Animes','Música','Religioso'];
export type Product={id:string;title:string;category:string;image:string;description:string;posterPrice:number|null;framePrice:number|null;active:boolean;demo:boolean;tmdb?:{id:number;type:'movie'|'tv';posterPath:string}};
export type Settings={name:string;whatsapp:string;posterPrice:number|null;framePrice:number|null};
export const initialSettings:Settings={name:'Enquadraria',whatsapp:'',posterPrice:null,framePrice:null};
export const initialProducts:Product[]=[
 ['orbita','Além da órbita','Filmes','Uma viagem pelas formas, cores e pelo infinito.'],
 ['episodio','Só mais um episódio','Séries','Para quem sempre tem uma próxima história para acompanhar.'],
 ['sol','O caminho do sol','Animes','Uma composição inspirada na energia das aventuras japonesas.'],
 ['ritmo','No seu ritmo','Música','Cor, movimento e uma boa trilha sonora.'],
 ['fe','Onde mora a fé','Religioso','Um lembrete delicado para os dias de esperança.'],
 ['cinema','Cinema em casa','Filmes','O encanto da tela grande em uma composição gráfica.']
 ].map(([id,title,category,description])=>({id,title,category,description,image:'/art/'+id+'.svg',posterPrice:null,framePrice:null,active:true,demo:true}));
export function money(value:number|null){return value===null?'Sob consulta':value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
