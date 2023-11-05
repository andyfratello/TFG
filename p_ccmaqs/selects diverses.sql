select t.*, t.rowid from SCH_GRAFICO_PROYECTOS t;
select orden_de_fabricacion, secuencia, Y, nexttask from sch_grafico_proyectos order by 1,2;

select * from sch_of_cab;
select * from ORDENES_FABRICA_CAB;

SELECT 121
      FROM dual;
      
SELECT distinct(id_sesion)
      FROM sch_grafico_proyectos;

SELECT 1
    FROM SCH_GRAFICO_RECURSOS
    WHERE codigo_empresa = '03'
      AND codigo_org_planta = '01'
      AND numero_simulacion = '1';
