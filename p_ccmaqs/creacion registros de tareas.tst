PL/SQL Developer Test script 3.0
14
-- Created on 26/10/2023 by EDISA 
declare 
  -- Local variables here
  v_id_sesion number;
begin
  -- Test statements here
    SELECT smproductsequence.nextval
      INTO v_id_sesion
      FROM dual;
  
    sch_carga_maquinas.prepara_grafico('1', '01', '03', null, null, null, null, null, null, null, null, v_id_sesion, null, null, null, null);
  
    sch_carga_maquinas.calcula_carga_maquinas('03', '01', '1', v_id_sesion);
end;
0
0