use cosmwasm_std::{
    attr, entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo,
    Response, StdResult
};

use crate::msg::{ InstantiateMsg , ExecuteMsg, QueryMsg, DataResponse };
use crate::state::{State, STATE};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    let state = State {
        x: 0u64
    };

    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attributes(vec![
            attr("action", "instantiate"),
            attr("x", "0"),
        ])
    )
}


#[entry_point]
pub fn execute(deps: DepsMut, _env: Env, _info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Set{
            x
        } => execute_set(deps, x),
        ExecuteMsg::Increment{} => execute_increment(deps),
    }
}

fn execute_set(
    deps: DepsMut,
    x: u64,
) -> StdResult<Response> {
    let state = State {
        x: x
    };
    STATE.save(deps.storage, &state)?;
    Ok(Response::default().add_attributes(vec![
        attr("action", "set"),
        attr("x",x.to_string())
    ]))
}

fn execute_increment(
    deps: DepsMut,
) -> StdResult<Response> {
    let mut state = STATE.load(deps.storage)?;
    state.x += 1;
    STATE.save(deps.storage, &state)?;
    Ok(Response::default().add_attributes(vec![
        attr("action", "increment"),
    ]))
}



#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Get{} => to_binary(&query_x(deps)?),
    }
}

fn query_x(deps: Deps) -> StdResult<DataResponse> {
    let state = STATE.load(deps.storage)?;
    Ok(DataResponse { x: state.x })
}


#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::{
        testing::{mock_dependencies, mock_env, mock_info},
        from_binary,
    };

    #[test]
    fn test_instantiate() {
        let mut deps = mock_dependencies(&[]);
        let env = mock_env();
        let owner = "owner";
        let info = mock_info(owner, &[]);
        let msg = InstantiateMsg {};
        let res = instantiate(deps.as_mut(), env, info.clone(), msg).unwrap();

        assert_eq!(2, res.attributes.len());

        //checking
        let state = STATE.load(deps.as_ref().storage).unwrap();
        assert_eq!(state.x, 0);
    }

    #[test]
    fn test_execute_set() {
        let mut deps = mock_dependencies(&[]);
        let env = mock_env();
        let owner = "owner";
        let info = mock_info(owner, &[]);
        let msg = InstantiateMsg {};
        let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let msg = ExecuteMsg::Set {
            x: 10u64
        };

        //add address for registered moderator

        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg.clone()).unwrap();
        let expected = Response::default().add_attributes(vec![
            attr("action", "set"),
            attr("x", 10u64.to_string()),
        ]);
        assert_eq!(expected, res);

        let query_msg = QueryMsg::Get{};

        let res = query(deps.as_ref(), env.clone(), query_msg).unwrap();
        let val: DataResponse = from_binary(&res).unwrap();
        let expected = DataResponse {
            x: 10u64
        };
        assert_eq!(val, expected);
    }

    #[test]
    fn test_execute_increment() {
        let mut deps = mock_dependencies(&[]);
        let env = mock_env();
        let owner = "owner";
        let info = mock_info(owner, &[]);
        let msg = InstantiateMsg {};
        let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let msg = ExecuteMsg::Increment{};

        //add address for registered moderator

        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg.clone()).unwrap();
        let expected = Response::default().add_attributes(vec![
            attr("action", "increment"),
        ]);
        assert_eq!(expected, res);

        let query_msg = QueryMsg::Get{};

        let res = query(deps.as_ref(), env.clone(), query_msg).unwrap();
        let val: DataResponse = from_binary(&res).unwrap();
        let expected = DataResponse {
            x: 1u64
        };
        assert_eq!(val, expected);
    }

}
