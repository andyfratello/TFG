PL/SQL Developer Test script 3.0
15
-- Created on 03/11/2023 by EDISA 
declare 
  -- Local variables here
  v_en_uso NUMBER := 0;
begin
  -- Test statements here
  SELECT 1
    INTO v_en_uso
    FROM SCH_GRAFICO_RECURSOS
   WHERE codigo_empresa = '03'
      AND codigo_org_planta = '01'
      AND numero_simulacion = '1';

    DBMS_OUTPUT.PUT_LINE(v_en_uso);
end;
0
0
